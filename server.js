import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { EventEmitter } from 'events';
import { use, toString, innerHTML, html, release, createTree } from 'diffhtml';
import 'diffhtml-components';
import express from 'express';
import { WebSocketServer } from 'ws';
import { getUUID } from './worker-middleware/get-uuid.js';
import { workerTask } from './worker-middleware/worker-task.js';
import App from './app.js';

const ee = new EventEmitter();
const app = express();

// Reuse the web-worker middleware on the server, by default send is
// postMessage, but that doesn't exist in Node. Instead use a simple event
// emitter.
use(workerTask({
  send: (uuid, ...args) => ee.emit(`deltas:${uuid}`, ...args),

  getProperty: async (globalObject, keyName) => {
    ee.emit('getProperty', { globalObject, keyName });
  },
}));

// Serve this directory for static files.
app.use(express.static('.'));

const server = app.listen(8000, '0.0.0.0', () => {
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

  ee.on('getProperty', property => {
    const onMessage = e => {
      ws.off('message', onMessage);
    };

    ws.on('message', onMessage);
    ws.send(JSON.stringify(property));
  });

  // Whenever new deltas arrive, send them over the websocket. You could
  // thereotically scope per user.
  ee.on(`deltas:${uuid}`, deltas => ws.send(JSON.stringify(deltas)));

  // Ensure cleanup whenever a socket is closed.
  ws.on('close', () => {
    release(mount);
    clearInterval(interval);
  });

  // Initial render.
  innerHTML(mount, html`<${App} threadId=${uuid} />`, { uuid });

  // Re-render at an interval.
  interval = setInterval(() => {
    innerHTML(mount, html`<${App} threadId=${uuid} />`, { uuid });
  }, 1000 / 60);
});
