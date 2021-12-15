import { parentPort, threadId } from 'worker_threads';
import { innerHTML, createTree, html, use } from 'diffhtml';
import 'diffhtml-components';
import { workerTask } from './worker-middleware/worker-task.js';
import App from './app.js';

// Don't let a thread last longer than 12 hours, they will be
// killed earlier in most cases.
const MAX_TTL = 12 * 60 * 60 * 1000;

// Get only patches and generate a link id for the first usage of a VTree,
// and then replace subsequent uses with it.
const callers = new Map();

use(workerTask({
  send: (_uuid, patches) => parentPort.postMessage(patches),
  callers,
}));

const mount = createTree(null);

setInterval(() => {
  // Send deltas back to main thread
  innerHTML(mount, html`<${App} threadId=${threadId} />`);
}, 100);

innerHTML(mount, html`<${App} threadId=${threadId} />`);

// Kill a thread if it lives longer than TTL, this also acts as a
// keep-alive for node threads that run out of work.
setTimeout(() => {
  process.exit();
}, MAX_TTL);
