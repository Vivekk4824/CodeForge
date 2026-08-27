import { spawn } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import os from 'os';
import axios from 'axios';

// Configurable limits
const EXECUTION_TIMEOUT = 5000; // 5 seconds
const MAX_BUFFER = 1024 * 1024; // 1MB

// Executor pool service configuration
const EXECUTOR_HOST = process.env.EXECUTOR_HOST || 'localhost';
const EXECUTOR_PORT = process.env.EXECUTOR_PORT || 6000;
const EXECUTOR_URL = `http://${EXECUTOR_HOST}:${EXECUTOR_PORT}`;
const USE_POOL = process.env.USE_EXECUTOR_POOL === 'true';

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
  const runId = uuidv4();
  const tempDir = path.join(os.tmpdir(), `ai-coding-platform-${runId}`);

  try {
    await fs.mkdir(tempDir, { recursive: true });

    switch (language) {
      case 'cpp':
        return await executeCpp(code, input, tempDir);
      case 'python':
        return await executePython(code, input, tempDir);
      case 'javascript':
        return await executeJavaScript(code, input, tempDir);
      case 'java':
        return await executeJava(code, input, tempDir);
      default:
        throw new Error(`Language ${language} is not supported yet.`);
    }
  } catch (error) {
    return {
      success: false,
      output: null,
      error: error.message,
      executionTime: 0
    };
  } finally {
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch (e) {
      console.error(`Failed to cleanup temp dir ${tempDir}:`, e);
    }
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

const runDockerContainer = async (tempDir, dockerImage, runCommand, startTime) => {
  const normalizedTempDir = process.platform === 'win32'
    ? tempDir.replace(/\\/g, '/')
    : tempDir;

  return await new Promise((resolve) => {
    const dockerArgs = [
      'run', '--rm',
      '--network', 'none',
      '--memory', '256m',
      '--cpus', '1',
      '-v', `${normalizedTempDir}:/usr/src/app`,
      '-w', '/usr/src/app',
      dockerImage,
      'sh', '-c', runCommand
    ];

    const runProcess = spawn('docker', dockerArgs);
    let output = '';
    let errorOutput = '';

    const timeout = setTimeout(() => {
      runProcess.kill('SIGKILL');
      resolve({
        success: false,
        output,
        error: 'Time Limit Exceeded (TLE)',
        executionTime: Date.now() - startTime
      });
    }, EXECUTION_TIMEOUT);

    runProcess.stdout.on('data', (data) => {
      output += data.toString();
      if (output.length > MAX_BUFFER) {
        runProcess.kill('SIGKILL');
        resolve({
          success: false,
          output,
          error: 'Output Limit Exceeded',
          executionTime: Date.now() - startTime
        });
      }
    });

    runProcess.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    runProcess.on('close', (code, signal) => {
      clearTimeout(timeout);

      if (signal === 'SIGKILL') return;

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

const executeCpp = async (code, input, tempDir) => {
  const sourceFile = path.join(tempDir, 'main.cpp');
  const inputFile = path.join(tempDir, 'input.txt');
  await fs.writeFile(sourceFile, code);
  await fs.writeFile(inputFile, input || '');

  const runCommand = 'g++ main.cpp -o main -O2 && ./main < input.txt';
  return await runDockerContainer(tempDir, 'gcc:latest', runCommand, Date.now());
};

const executePython = async (code, input, tempDir) => {
  const sourceFile = path.join(tempDir, 'main.py');
  const inputFile = path.join(tempDir, 'input.txt');
  await fs.writeFile(sourceFile, code);
  await fs.writeFile(inputFile, input || '');

  const runCommand = 'python main.py < input.txt';
  return await runDockerContainer(tempDir, 'python:3.9-slim', runCommand, Date.now());
};

const executeJavaScript = async (code, input, tempDir) => {
  const sourceFile = path.join(tempDir, 'main.js');
  const inputFile = path.join(tempDir, 'input.txt');
  await fs.writeFile(sourceFile, code);
  await fs.writeFile(inputFile, input || '');

  const runCommand = 'node main.js < input.txt';
  return await runDockerContainer(tempDir, 'node:18-alpine', runCommand, Date.now());
};

const executeJava = async (code, input, tempDir) => {
  const sourceFile = path.join(tempDir, 'Main.java');
  const inputFile = path.join(tempDir, 'input.txt');
  await fs.writeFile(sourceFile, code);
  await fs.writeFile(inputFile, input || '');

  const runCommand = 'javac Main.java && java Main < input.txt';
  return await runDockerContainer(tempDir, 'eclipse-temurin:17-jdk', runCommand, Date.now());
};
