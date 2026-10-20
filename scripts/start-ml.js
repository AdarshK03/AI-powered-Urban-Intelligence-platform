import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');
const mlDir = path.join(rootDir, 'ml-service');

// Auto-detect Python executable in virtual environment
const winVenvPython = path.join(mlDir, '.venv', 'Scripts', 'python.exe');
const unixVenvPython = path.join(mlDir, '.venv', 'bin', 'python');

let pythonBin = 'python';
if (fs.existsSync(winVenvPython)) {
  pythonBin = winVenvPython;
} else if (fs.existsSync(unixVenvPython)) {
  pythonBin = unixVenvPython;
}

const args = ['-m', 'uvicorn', 'app:app', '--host', '127.0.0.1', '--port', '8000', '--reload'];

console.log(`[ML] Starting AI Inference Service with ${pythonBin}...`);

const child = spawn(pythonBin, args, {
  cwd: mlDir,
  stdio: 'inherit',
  shell: true,
});

child.on('error', (err) => {
  console.error('[ML] Failed to start Python ML service:', err.message);
  process.exit(1);
});

child.on('exit', (code) => {
  process.exit(code ?? 0);
});
