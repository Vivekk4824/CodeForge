import { spawn } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import os from 'os';

// Configurable limits
const EXECUTION_TIMEOUT = 5000; // 5 seconds
const MAX_BUFFER = 1024 * 1024; // 1MB

export const executeCode = async (language, code, input) => {
  const runId = uuidv4();
  const tempDir = path.join(os.tmpdir(), `ai-coding-platform-${runId}`);
  
  try {
    await fs.mkdir(tempDir, { recursive: true });
    
    if (language === 'cpp') {
      return await executeCpp(code, input, tempDir, runId);
    } else {
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
    // Cleanup temporary directory
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch (e) {
      console.error(`Failed to cleanup temp dir ${tempDir}:`, e);
    }
  }
};

const executeCpp = async (code, input, tempDir, runId) => {
  const sourceFile = path.join(tempDir, 'main.cpp');
  const inputFile = path.join(tempDir, 'input.txt');

  await fs.writeFile(sourceFile, code);
  await fs.writeFile(inputFile, input || '');

  // Convert Windows path to Docker-friendly path if necessary
  const normalizedTempDir = process.platform === 'win32' 
    ? tempDir.replace(/\\/g, '/')
    : tempDir;

  const startTime = Date.now();
  
  return await new Promise((resolve) => {
    // Run Docker container with gcc:latest
    // Mount tempDir, compile, and run with input
    const dockerArgs = [
      'run', '--rm',
      '--network', 'none', // Disable network access for security
      '--memory', '256m', // Limit memory
      '--cpus', '1', // Limit CPU
      '-v', `${normalizedTempDir}:/usr/src/app`,
      '-w', '/usr/src/app',
      'gcc:latest',
      'sh', '-c', 'g++ main.cpp -o main -O2 && ./main < input.txt'
    ];

    const runProcess = spawn('docker', dockerArgs);
    let output = '';
    let errorOutput = '';

    // Handle timeout
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
        // If it's a compilation error or runtime error
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
