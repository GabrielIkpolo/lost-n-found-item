import { exec } from 'child_process';
import { getLocalIpAddress } from './getIp.js';

const ipAddress = getLocalIpAddress();

if (!ipAddress) {
  console.error("❌ Could not find a local IP address. Cannot start server.");
  process.exit(1);
}

// Your backend is on port 3000
const backendUrl = `http://${ipAddress}:3000`;

console.log('----------------------------------------------------');
console.log(`💻 Detected local IP: ${ipAddress}`);
console.log(`⚙️  Setting API Base URL for Vite to: ${backendUrl}`);
console.log('----------------------------------------------------');

// We will pass the detected URL as an environment variable to the Vite command
const command = `VITE_REACT_APP_API_BASE_URL=${backendUrl} vite --host`;

// Execute the command
const viteProcess = exec(command);

// Pipe the output of the Vite process to our console so we can see it
viteProcess.stdout.pipe(process.stdout);
viteProcess.stderr.pipe(process.stderr);

viteProcess.on('exit', (code) => {
  console.log(`Vite process exited with code ${code}`);
});