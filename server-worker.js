import { parentPort, threadId } from 'worker_threads';
import { innerHTML, createTree, html, use } from 'diffhtml';
import 'diffhtml-components';
import { workerTask } from './worker-middleware/worker-task.js';
import App from './app.js';

// Get only patches and generate a link id for the first usage of a VTree,
// and then replace subsequent uses with it.
use(workerTask({
  send: (uuid, patches) => parentPort.postMessage(patches),
}));

const mount = createTree(null);

setInterval(() => {
  // Send deltas back to main thread
  innerHTML(mount, html`<${App} threadId=${threadId} />`);
}, 100);

innerHTML(mount, html`<${App} threadId=${threadId} />`);

// End the thread every 2 seconds
//setInterval(() => {
//  process.exit();
//}, 2000);

