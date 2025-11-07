// Minimal MCP client to check if Nutrition MCP server is running
// Usage: node check-server.js

const { spawn } = require('child_process');

const serverProcess = spawn('node', ['./build/index.js'], {
  stdio: ['pipe', 'pipe', 'inherit'],
  env: process.env,
});

const initializeMsg = {
  method: 'initialize',
  params: {
    protocolVersion: '2025-06-18',
    capabilities: {},
    clientInfo: { name: 'check-script', version: '0.1.0' },
  },
  jsonrpc: '2.0',
  id: 0,
};

serverProcess.stdout.on('data', (data) => {
  console.error('[Server stdout]', data.toString());
});

serverProcess.stdin.write(JSON.stringify(initializeMsg) + '\n');

setTimeout(() => {
  serverProcess.kill();
  console.log('Check complete. If you saw a response above, the server is running.');
}, 2000);
