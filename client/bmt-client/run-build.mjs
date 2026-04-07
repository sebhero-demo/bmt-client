import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const cwd = process.cwd();
const nodeModulesBin = resolve(cwd, 'node_modules/.bin');

// Use spawn with explicit PATH
const env = { 
  ...process.env, 
  PATH: `${nodeModulesBin}:${process.env.PATH}`
};

console.log('Building...');

// TypeScript compile
await new Promise((resolve, reject) => {
  const tsc = spawn('sh', ['-c', 'tsc -b'], { cwd, env, stdio: 'inherit' });
  tsc.on('close', code => code === 0 ? resolve(undefined) : reject(code));
});

// Vite build
await new Promise((resolve, reject) => {
  const vite = spawn('sh', ['-c', 'vite build'], { cwd, env, stdio: 'inherit' });
  vite.on('close', code => code === 0 ? resolve(undefined) : reject(code));
});

console.log('Build complete!');