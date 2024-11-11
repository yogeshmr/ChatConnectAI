import { spawn } from 'child_process';
import { Express, Request, Response } from 'express';
import { randomBytes } from 'crypto';
import { promises as fs } from 'fs';
import { join } from 'path';

const TIMEOUT = 5000; // 5 seconds timeout
const MAX_BUFFER = 512 * 1024; // 512KB output limit
const MAX_CODE_SIZE = 64 * 1024; // 64KB code size limit
const SANDBOX_DIR = 'sandbox_temp';

interface ExecuteCodeRequest {
  code: string;
  language: string;
}

async function ensureSandboxDir() {
  try {
    await fs.mkdir(SANDBOX_DIR);
  } catch (err: any) {
    if (err.code !== 'EEXIST') throw err;
  }
}

export function setupSandbox(app: Express) {
  // Ensure sandbox directory exists
  ensureSandboxDir();

  app.post('/api/execute-code', async (req: Request<{}, {}, ExecuteCodeRequest>, res: Response) => {
    const { code, language } = req.body;

    if (!code || !language) {
      return res.status(400).json({ error: 'Code and language are required' });
    }

    if (language !== 'python') {
      return res.status(400).json({ error: 'Only Python is supported at the moment' });
    }

    if (code.length > MAX_CODE_SIZE) {
      return res.status(400).json({ error: 'Code exceeds maximum size limit' });
    }

    // Check for dangerous imports and system calls
    const dangerousPatterns = [
      /import\s+os/,
      /import\s+sys/,
      /import\s+subprocess/,
      /from\s+os\s+import/,
      /from\s+sys\s+import/,
      /from\s+subprocess\s+import/,
      /open\s*\(/,
      /__import__/,
      /eval\s*\(/,
      /exec\s*\(/,
    ];

    if (dangerousPatterns.some(pattern => pattern.test(code))) {
      return res.status(400).json({ 
        error: 'Code contains potentially dangerous operations' 
      });
    }

    try {
      // Generate a random filename
      const filename = join(SANDBOX_DIR, `temp_${randomBytes(16).toString('hex')}.py`);
      
      // Write code to temporary file
      await fs.writeFile(filename, code);

      // Execute the code in a sandboxed environment
      const process = spawn('python3', ['-u', filename], {
        timeout: TIMEOUT,
        env: { PYTHONPATH: '' },  // Empty PYTHONPATH for isolation
      });

      let output = '';
      let error = '';

      process.stdout.on('data', (data) => {
        output += data.toString();
        if (output.length > MAX_BUFFER) {
          process.kill();
          error = 'Output exceeded maximum buffer size';
        }
      });

      process.stderr.on('data', (data) => {
        error += data.toString();
      });

      // Handle process completion
      const result = await new Promise((resolve) => {
        process.on('close', (code) => {
          // Clean up temporary file
          fs.unlink(filename).catch(console.error);

          resolve({
            success: code === 0,
            output: output || null,
            error: error || null,
          });
        });
      });

      res.json(result);
    } catch (err: any) {
      console.error('Code execution error:', err);
      res.status(500).json({ 
        success: false,
        error: err.message || 'Failed to execute code'
      });
    }
  });

  // Cleanup old files periodically
  setInterval(async () => {
    try {
      const files = await fs.readdir(SANDBOX_DIR);
      const now = Date.now();
      
      for (const file of files) {
        const filePath = join(SANDBOX_DIR, file);
        const stats = await fs.stat(filePath);
        
        // Remove files older than 1 hour
        if (now - stats.mtime.getTime() > 3600000) {
          await fs.unlink(filePath);
        }
      }
    } catch (err) {
      console.error('Sandbox cleanup error:', err);
    }
  }, 3600000); // Run every hour
}
