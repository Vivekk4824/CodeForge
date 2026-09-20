import { spawn } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import os from 'os';
import axios from 'axios';

// Configurable limits (15s allows Docker container spin-up + compilation on local Windows)
const EXECUTION_TIMEOUT = parseInt(process.env.EXECUTION_TIMEOUT, 10) || 15000;
const MAX_BUFFER = 1024 * 1024; // 1MB

// Executor pool service configuration
const EXECUTOR_HOST = process.env.EXECUTOR_HOST || 'localhost';
const EXECUTOR_PORT = process.env.EXECUTOR_PORT || 6000;
const EXECUTOR_URL = `http://${EXECUTOR_HOST}:${EXECUTOR_PORT}`;
const USE_POOL = process.env.USE_EXECUTOR_POOL === 'true';

const RESOURCE_LIMITS = {
  java: { memory: '512m', cpus: '2' },
  cpp: { memory: '256m', cpus: '2' },
  python: { memory: '128m', cpus: '1' },
  javascript: { memory: '128m', cpus: '1' }
};

/**
 * Execute code using the warm pooled executor service
 * This routes to containerized executors that are kept warm for faster execution
 */
export const executeCodeWithPool = async (language, code, input) => {
  try {
    // Route to executor pool service
    const response = await axios.post(`${EXECUTOR_URL}/execute`, {
      language,
      code,
      input: input || ''
    }, {
      timeout: EXECUTION_TIMEOUT + 1000
    });

    return response.data;
  } catch (error) {
    console.error('Executor pool error:', error.message);
    // Fallback to direct execution
    return await executeCodeDirect(language, code, input);
  }
};

/**
 * Direct execution (fallback if pool is unavailable)
 */
export const executeCodeDirect = async (language, code, input) => {
  const startTime = Date.now();
  try {
    switch (language) {
      case 'cpp':
        return await executeCpp(code, input, startTime);
      case 'python':
        return await executePython(code, input, startTime);
      case 'javascript':
        return await executeJavaScript(code, input, startTime);
      case 'java':
        return await executeJava(code, input, startTime);
      default:
        throw new Error(`Language ${language} is not supported yet.`);
    }
  } catch (error) {
    return {
      success: false,
      output: null,
      error: error.message,
      executionTime: Date.now() - startTime
    };
  }
};

/**
 * Main execution function - routes to pool or direct based on configuration
 */
export const executeCode = async (language, code, input) => {
  if (USE_POOL) {
    return await executeCodeWithPool(language, code, input);
  } else {
    return await executeCodeDirect(language, code, input);
  }
};

const runDockerContainer = async (dockerImage, runCommand, startTime, language) => {
  const limits = RESOURCE_LIMITS[language] || { memory: '256m', cpus: '1' };
  return await new Promise((resolve) => {
    const dockerArgs = [
      'run', '--rm',
      '--network', 'none',
      '--memory', limits.memory,
      '--cpus', limits.cpus,
      dockerImage,
      'sh', '-c', runCommand
    ];

    const runProcess = spawn('docker', dockerArgs);
    const outputChunks = [];
    const errorChunks = [];
    let outputLength = 0;
    let errorLength = 0;

    const timeout = setTimeout(() => {
      runProcess.kill('SIGKILL');
      const errOut = Buffer.concat(errorChunks).toString('utf8');
      resolve({
        success: false,
        output: Buffer.concat(outputChunks).toString('utf8'),
        error: errOut ? `Time Limit Exceeded (TLE)\n${errOut}` : 'Time Limit Exceeded (TLE)',
        executionTime: Date.now() - startTime
      });
    }, EXECUTION_TIMEOUT);

    runProcess.stdout.on('data', (data) => {
      if (outputLength > MAX_BUFFER) return;
      
      if (outputLength + data.length > MAX_BUFFER) {
        const allowedSlice = data.slice(0, MAX_BUFFER - outputLength);
        outputChunks.push(allowedSlice);
        outputChunks.push(Buffer.from('\n...[Output Truncated]'));
        outputLength = MAX_BUFFER + 1;
        
        runProcess.kill('SIGKILL');
        clearTimeout(timeout);
        resolve({
          success: false,
          output: Buffer.concat(outputChunks).toString('utf8'),
          error: 'Output Limit Exceeded',
          executionTime: Date.now() - startTime
        });
      } else {
        outputChunks.push(data);
        outputLength += data.length;
      }
    });

    runProcess.stderr.on('data', (data) => {
      if (errorLength > MAX_BUFFER) return;
      
      if (errorLength + data.length > MAX_BUFFER) {
        const allowedSlice = data.slice(0, MAX_BUFFER - errorLength);
        errorChunks.push(allowedSlice);
        errorChunks.push(Buffer.from('\n...[Error Output Truncated]'));
        errorLength = MAX_BUFFER + 1;
        
        runProcess.kill('SIGKILL');
        clearTimeout(timeout);
        resolve({
          success: false,
          output: Buffer.concat(outputChunks).toString('utf8'),
          error: 'Error Output Limit Exceeded',
          executionTime: Date.now() - startTime
        });
      } else {
        errorChunks.push(data);
        errorLength += data.length;
      }
    });

    runProcess.on('close', (code, signal) => {
      clearTimeout(timeout);

      if (signal === 'SIGKILL') return;
      
      const output = Buffer.concat(outputChunks).toString('utf8');
      const errorOutput = Buffer.concat(errorChunks).toString('utf8');

      if (code !== 0) {
        resolve({
          success: false,
          output,
          error: errorOutput || `Execution Error (Exit code: ${code})`,
          executionTime: Date.now() - startTime
        });
      } else {
        resolve({
          success: true,
          output,
          error: null,
          executionTime: Date.now() - startTime
        });
      }
    });
  });
};

const executeCpp = async (code, input, startTime) => {
  const b64Code = Buffer.from(code).toString('base64');
  const b64Input = Buffer.from(input || '').toString('base64');
  const runCommand = `mkdir -p /tmp/run && cd /tmp/run && echo '${b64Code}' | base64 -d > main.cpp && echo '${b64Input}' | base64 -d > input.txt && g++ main.cpp -o main -O2 && ./main < input.txt`;
  return await runDockerContainer('gcc:latest', runCommand, startTime, 'cpp');
};

const executePython = async (code, input, startTime) => {
  const b64Code = Buffer.from(code).toString('base64');
  const b64Input = Buffer.from(input || '').toString('base64');
  const runCommand = `mkdir -p /tmp/run && cd /tmp/run && echo '${b64Code}' | base64 -d > main.py && echo '${b64Input}' | base64 -d > input.txt && python main.py < input.txt`;
  return await runDockerContainer('python:3.9-slim', runCommand, startTime, 'python');
};

const executeJavaScript = async (code, input, startTime) => {
  const b64Code = Buffer.from(code).toString('base64');
  const b64Input = Buffer.from(input || '').toString('base64');
  const runCommand = `mkdir -p /tmp/run && cd /tmp/run && echo '${b64Code}' | base64 -d > main.js && echo '${b64Input}' | base64 -d > input.txt && node main.js < input.txt`;
  return await runDockerContainer('node:18-alpine', runCommand, startTime, 'javascript');
};

const executeJava = async (code, input, startTime) => {
  const b64Code = Buffer.from(code).toString('base64');
  const b64Input = Buffer.from(input || '').toString('base64');
  const runCommand = `mkdir -p /tmp/run && cd /tmp/run && echo '${b64Code}' | base64 -d > Main.java && echo '${b64Input}' | base64 -d > input.txt && javac Main.java && java Main < input.txt`;
  return await runDockerContainer('eclipse-temurin:17-jdk', runCommand, startTime, 'java');
};
