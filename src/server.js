import { createApp } from './app.js';

const port = Number(process.env.PORT || 3000);
const app = createApp();

app.server.listen(port, '127.0.0.1', () => {
  console.log(`SmartOrder running locally: http://127.0.0.1:${port}`);
});

app.server.on('error', (error) => {
  console.error(error.message);
  app.close();
  process.exitCode = 1;
});
