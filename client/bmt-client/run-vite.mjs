import { spawn } from 'child_process';
const proc = spawn('node', ['node_modules/vite/bin/vite.js', 'dev', '--host'], { 
  stdio: 'inherit', 
  shell: true,
  cwd: '/data/data/com.termux/files/home/Desktop/codespace/beast_mode_todo/client/bmt-client'
});
proc.on('error', console.error);
proc.on('exit', (code) => console.log('Exit:', code));
