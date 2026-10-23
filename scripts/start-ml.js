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

  // Check common candidate interpreters that have torch & uvicorn installed
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
      // Continue to next candidate
    }
  }

  return { bin: 'python', extraArgs: [] };
}

const detected = detectPython();
const pythonBin = detected.bin;
const extraArgs = detected.extraArgs || [];
const args = [...extraArgs, '-m', 'uvicorn', 'app:app', '--host', '127.0.0.1', '--port', '8000', '--reload'];

console.log(`[ML] Starting AI Inference Service with ${pythonBin}...`);

try {
  const child = spawn(pythonBin, args, {
    cwd: mlDir,
    stdio: 'inherit',
    shell: true,
  });

  child.on('error', (err) => {
    console.warn('[ML Notice] Python ML service could not start:', err.message);
    console.warn('[ML Notice] System will use built-in heuristic defect classification.');
    // Keep process alive so concurrently doesn't terminate client & server
    setInterval(() => {}, 60000);
  });

  child.on('exit', (code) => {
    if (code !== 0) {
      console.warn(`[ML Notice] Python uvicorn exited with code ${code}.`);
      console.warn('[ML Notice] (Install requirements with: pip install -r ml-service/requirements.txt)');
      console.warn('[ML Notice] Node.js server will continue running and handle defect classification.');
      // Keep process alive so concurrently doesn't terminate client & server
      setInterval(() => {}, 60000);
    } else {
      process.exit(0);
    }
  });
} catch (e) {
  console.warn('[ML Notice] Failed to spawn ML service. Keeping standby process alive:', e.message);
  setInterval(() => {}, 60000);
}
