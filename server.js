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

// Reuse the web-worker middleware on the server, by default send is
// postMessage, but that doesn't exist in Node. Instead use a simple event
// emitter.
use(workerTask({
  send: (...args) => ee.emit('deltas', ...args),
}));

// Serve this directory for static files.
app.use(express.static('.'));

const server = app.listen(8000, () => {
  console.log('Listening on http://localhost:8000');
});

// Reuse the express connection.
const wss = new WebSocketServer({ server });

wss.on('connection', ws => {
  // Create a mount per connection, this will map to `<main></main>` in
  // `index.html`.
  const mount = createTree(null);
  // Generate a UUID to simulate a web worker threadId.
  const uuid = getUUID();

  let interval = null;

  // Whenever new deltas arrive, send them over the websocket. You could
  // thereotically scope per user.
  ee.on('deltas', deltas => ws.send(JSON.stringify(deltas)));

  // Ensure cleanup whenever a socket is closed.
  ws.on('close', () => {
    release(mount);
    clearInterval(interval);
  });

  // Initial render.
  innerHTML(mount, html`<${App} threadId=${uuid} />`);

  // Re-render at an interval.
  interval = setInterval(() => {
    innerHTML(mount, html`<${App} threadId=${uuid} />`);
  }, 1000 / 60);
});
