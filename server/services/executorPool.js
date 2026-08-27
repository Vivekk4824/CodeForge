import express from 'express';
import axios from 'axios';
import { spawn } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
app.use(express.json());

// ============================================================================
// Executor Pool Configuration
// ============================================================================

const POOL_SIZE = parseInt(process.env.POOL_SIZE || '3', 10);
const EXECUTION_TIMEOUT = 5000;
const MAX_BUFFER = 1024 * 1024;
const TEMP_DIR = process.env.TEMP_DIR || '/tmp/codeforge';

const EXECUTORS = {
  cpp: {
    image: process.env.CPP_IMAGE || 'codeforge:cpp-executor',
    containers: [],
    queue: []
  },
  python: {
    image: process.env.PYTHON_IMAGE || 'codeforge:python-executor',
    containers: [],
    queue: []
  },
  javascript: {
    image: process.env.JS_IMAGE || 'codeforge:js-executor',
    containers: [],
    queue: []
  },
  java: {
    image: process.env.JAVA_IMAGE || 'codeforge:java-executor',
    containers: [],
    queue: []
  }
};

// ============================================================================
// Executor Pool Management
// ============================================================================

/**
 * Gets or creates an executor container for the given language
 */
const getExecutorContainer = async (language) => {
  if (!EXECUTORS[language]) {
    throw new Error(`Unsupported language: ${language}`);
  }

  const executor = EXECUTORS[language];

  // Return pooled container if available
  if (executor.containers.length > 0) {
    return executor.containers.pop();
  }

  // Create new container on demand if pool is depleted
  const containerId = await createExecutorContainer(language);
  return containerId;
};

/**
 * Creates a new executor container
 */
const createExecutorContainer = async (language) => {
  const containerId = `executor-${language}-${uuidv4().slice(0, 8)}`;
  const image = EXECUTORS[language].image;

  const dockerArgs = [
    'run', '-d',
    '--name', containerId,
    '--network', 'codeforge-network',
    '--memory', '256m',
    '--cpus', '1',
    '-v', `${TEMP_DIR}:/usr/src/app`,
    '-w', '/usr/src/app',
    image,
    'sh', '-c', 'tail -f /dev/null' // Keep alive
  ];

  return new Promise((resolve, reject) => {
    const proc = spawn('docker', dockerArgs);
    let output = '';
    let errors = '';

    proc.stdout.on('data', (data) => {
      output += data.toString();
    });

    proc.stderr.on('data', (data) => {
      errors += data.toString();
    });

    proc.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Failed to create container: ${errors}`));
      } else {
        resolve(output.trim());
      }
    });
  });
};

/**
 * Returns a container to the pool for reuse
 */
const returnContainerToPool = (language, containerId) => {
  if (EXECUTORS[language] && EXECUTORS[language].containers.length < POOL_SIZE) {
    EXECUTORS[language].containers.push(containerId);
  } else {
    // Remove container if pool is full
    destroyContainer(containerId);
  }
};

/**
 * Destroys a container
 */
const destroyContainer = async (containerId) => {
  return new Promise((resolve) => {
    const proc = spawn('docker', ['rm', '-f', containerId]);
    proc.on('close', () => resolve());
  });
};

/**
 * Executes code in a pooled container
 */
const executeInContainer = async (containerId, command, timeout = EXECUTION_TIMEOUT) => {
  return new Promise((resolve) => {
    const dockerArgs = [
      'exec',
      '--user', 'root',
      containerId,
      'sh', '-c', command
    ];

    const proc = spawn('docker', dockerArgs);
    let output = '';
    let errorOutput = '';

    const timeoutHandle = setTimeout(() => {
      proc.kill('SIGKILL');
      resolve({
        success: false,
        output,
        error: 'Time Limit Exceeded (TLE)',
        executionTime: timeout
      });
    }, timeout);

    proc.stdout.on('data', (data) => {
      const chunk = data.toString();
      output += chunk;

      if (output.length > MAX_BUFFER) {
        proc.kill('SIGKILL');
        clearTimeout(timeoutHandle);
        resolve({
          success: false,
          output,
          error: 'Output Limit Exceeded',
          executionTime: Date.now()
        });
      }
    });

    proc.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    proc.on('close', (code, signal) => {
      clearTimeout(timeoutHandle);

      if (signal === 'SIGKILL') return;

      if (code !== 0) {
        resolve({
          success: false,
          output,
          error: errorOutput || `Execution Error (Exit code: ${code})`,
          executionTime: Date.now()
        });
      } else {
        resolve({
          success: true,
          output,
          error: null,
          executionTime: Date.now()
        });
      }
    });
  });
};

// ============================================================================
// REST API Endpoints
// ============================================================================

/**
 * Health check endpoint
 */
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    poolStatus: Object.entries(EXECUTORS).reduce((acc, [lang, data]) => {
      acc[lang] = { available: data.containers.length, queued: data.queue.length };
      return acc;
    }, {})
  });
});

/**
 * Execute code endpoint
 * POST /execute
 * {
 *   "language": "cpp|python|javascript|java",
 *   "code": "source code",
 *   "input": "stdin input",
 *   "filename": "Main.java" // optional, for Java
 * }
 */
app.post('/execute', async (req, res) => {
  const { language, code, input = '', filename = null } = req.body;

  if (!language || !code) {
    return res.status(400).json({
      success: false,
      error: 'Missing required fields: language, code'
    });
  }

  const startTime = Date.now();
  let containerId = null;

  try {
    // Get or create executor container
    containerId = await getExecutorContainer(language);

    // Prepare execution command based on language
    let command;
    const srcDir = '/usr/src/app';

    switch (language.toLowerCase()) {
      case 'cpp':
        command = `echo '${code.replace(/'/g, "'\\''")}' > main.cpp && g++ -O2 main.cpp -o main && ./main < <(echo '${input.replace(/'/g, "'\\''")}')`;
        break;

      case 'python':
        command = `echo '${code.replace(/'/g, "'\\''")}' > main.py && python main.py < <(echo '${input.replace(/'/g, "'\\''")}')`;
        break;

      case 'javascript':
        command = `echo '${code.replace(/'/g, "'\\''")}' > main.js && node main.js < <(echo '${input.replace(/'/g, "'\\''")}')`;
        break;

      case 'java':
        const javaClass = filename ? filename.replace('.java', '') : 'Main';
        command = `echo '${code.replace(/'/g, "'\\''")}' > ${javaClass}.java && javac ${javaClass}.java && java ${javaClass} < <(echo '${input.replace(/'/g, "'\\''")}')`;
        break;

      default:
        return res.status(400).json({
          success: false,
          error: `Unsupported language: ${language}`
        });
    }

    // Execute in container
    const result = await executeInContainer(containerId, command);

    // Return container to pool for reuse (warm pooling)
    returnContainerToPool(language, containerId);

    res.json({
      ...result,
      executionTime: Date.now() - startTime
    });
  } catch (error) {
    if (containerId) {
      destroyContainer(containerId);
    }

    res.status(500).json({
      success: false,
      error: error.message,
      executionTime: Date.now() - startTime
    });
  }
});

/**
 * Pool stats endpoint
 */
app.get('/pool-stats', (req, res) => {
  const stats = Object.entries(EXECUTORS).reduce((acc, [lang, data]) => {
    acc[lang] = {
      pooled: data.containers.length,
      queued: data.queue.length,
      maxSize: POOL_SIZE
    };
    return acc;
  }, {});

  res.json(stats);
});

// ============================================================================
// Initialize and Start Server
// ============================================================================

const PORT = process.env.EXECUTOR_PORT || 6000;

app.listen(PORT, () => {
  console.log(`[ExecutorPool] Server running on port ${PORT}`);
  console.log(`[ExecutorPool] Pool size: ${POOL_SIZE}`);
  console.log(`[ExecutorPool] Execution timeout: ${EXECUTION_TIMEOUT}ms`);
});
