import { networkInterfaces } from 'os';

/**
 * Finds the local, non-internal IPv4 address of the machine.
 * @returns {string | null} The local IP address or null if not found.
 */
export const getLocalIpAddress= ()=> {
  const nets = networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      // Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
      if (net.family === 'IPv4' && !net.internal) {
        return net.address;
      }
    }
  }
  return null;
}