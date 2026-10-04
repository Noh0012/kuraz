import { networkInterfaces } from 'node:os';
import { createApp } from './app.js';
import { env } from './env.js';

createApp().listen(env.PORT, env.HOST, () => {
  console.log(`Kuraz API listening on http://${env.HOST}:${env.PORT}/v1`);
  // The phone (Expo Go) reaches the API over Wi-Fi, so print the LAN addresses.
  for (const nets of Object.values(networkInterfaces())) {
    for (const net of nets ?? []) {
      if (net.family === 'IPv4' && !net.internal) console.log(`  on your network: http://${net.address}:${env.PORT}/v1/health`);
    }
  }
});
