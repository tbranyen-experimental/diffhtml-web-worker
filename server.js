import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { EventEmitter } from 'events';
import { use, toString, innerHTML, html, release, createTree } from 'diffhtml';
import 'diffhtml-components';
import express from 'express';
import { WebSocketServer } from 'ws';
import { getUUID } from './worker-middleware/get-uuid.js';
import { workerTask } from './worker-middleware/worker-task.js';
import { createNodeWorker } from './worker-middleware/create-node-worker.js';
//import App from './app.js';

const ee = new EventEmitter();
const app = express();
const controller = {};

// Reuse the web-worker middleware on the server, by default send is
// postMessage, but that doesn't exist in Node. Instead use a simple event
// emitter.
use(workerTask({
  send: (uuid, ...args) => ee.emit(`deltas:${uuid}`, ...args),

  // todo impl
  getProperty: async (uuid, globalObject, keyName) => {
    ee.emit(`getProperty:${uuid}`, { globalObject, keyName });
  },

  controller,
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

  ee.on(`getProperty:${uuid}`, property => {
    ws.send(JSON.stringify(property));
  });

  ws.on('message', msg => {
    const message = JSON.parse(msg);

    if (message.type === 'caller') {
      controller.callFunction(uuid, message.__caller);
    }
  });

  // Whenever new deltas arrive, send them over the websocket. You could
  // thereotically scope per user.
  ee.on(`deltas:${uuid}`, deltas => ws.send(JSON.stringify(deltas)));

  // Ensure cleanup whenever a socket is closed.
  ws.on('close', () => {
    release(mount);
    clearInterval(interval);
    ee.removeAllListeners();
  });

  createNodeWorker('./server-worker.js', patches => {
    ws.send(JSON.stringify(patches));
  });
});
