import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

import { EventEmitter } from 'events';
import { use, toString, innerHTML, html, release, createTree } from 'diffhtml';
import 'diffhtml-components';
import express from 'express';
import { WebSocketServer } from 'ws';
import { getUUID, workerTask } from './worker-middleware/index.js';
import App from './app.js';

const ee = new EventEmitter();
const app = express();

use(workerTask({
  send: (...args) => ee.emit('deltas', ...args),
}));

app.get('/', (req, res, next) => {
  res.sendFile(join(dirname(fileURLToPath(import.meta.url)), 'index.html'));
});

app.use(express.static('.'));

const server = app.listen(8000, () => {
  console.log('Listening on http://localhost:8000');
});

const wss = new WebSocketServer({
  server,
});

wss.on('connection', ws => {
  const mount = createTree(null);
  const uuid = getUUID();

  let interval = null;

  ee.on('deltas', deltas => {
    ws.send(JSON.stringify(deltas));
  });

  ws.on('close', () => {
    release(mount);
    clearInterval(interval);
  });

  innerHTML(mount, html`<${App} threadId=${uuid} />`);

  // Start rendering.
  interval = setInterval(() => {
    innerHTML(mount, html`<${App} threadId=${uuid} />`);
  }, 1000 / 60);
});
