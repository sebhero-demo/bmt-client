const { spawn } = require('child_process');
const p = spawn('node', ['node_modules/vite/bin/vite.js', '--host'], {
  cwd: process.cwd(),
  stdio: 'inherit',
  env: { ...process.env, PATH: `${process.cwd()}/node_modules/.bin:${process.env.PATH}` }
});
p.on('exit', code => process.exit(code));