import { spawn, execSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');
const mlDir = path.join(rootDir, 'ml-service');

function detectPython() {
  const winVenvPython = path.join(mlDir, '.venv', 'Scripts', 'python.exe');
  const unixVenvPython = path.join(mlDir, '.venv', 'bin', 'python');

  if (fs.existsSync(winVenvPython)) {
    return { bin: winVenvPython, extraArgs: [] };
  }
  if (fs.existsSync(unixVenvPython)) {
    return { bin: unixVenvPython, extraArgs: [] };
  }
  if (process.env.PYTHON_BIN) {
    return { bin: process.env.PYTHON_BIN, extraArgs: [] };
  }

  const candidates = [
    { bin: 'py', extraArgs: ['-3.12'] },
    { bin: 'python', extraArgs: [] },
    { bin: 'python3', extraArgs: [] },
    { bin: 'py', extraArgs: [] },
  ];

  for (const cand of candidates) {
    try {
      const fullCmd = [cand.bin, ...cand.extraArgs, '-c', '"import torch, uvicorn"'].join(' ');
      execSync(fullCmd, { stdio: 'ignore', timeout: 5000 });
      return cand;
    } catch {
      // Continue
    }
  }

  return { bin: 'python', extraArgs: [] };
}

const detected = detectPython();
const pythonBin = detected.bin;
const extraArgs = detected.extraArgs || [];
const args = [...extraArgs, 'test_model.py'];

console.log(`[ML Test] Running ML model test suite with ${pythonBin}...`);

const child = spawn(pythonBin, args, {
  cwd: mlDir,
  stdio: 'inherit',
  shell: true,
});

child.on('exit', (code) => {
  process.exit(code || 0);
});
