import { parentPort, threadId } from 'worker_threads';
import { innerHTML, createTree, html, use } from 'diffhtml';
import 'diffhtml-components';
import { workerTask } from './middleware.mjs';
import App from './app.mjs';

// Get only patches and generate a link id for the first usage of a VTree,
// and then replace subsequent uses with it.
use(workerTask());

const mount = createTree(null);

setInterval(() => {
  // Send deltas back to main thread
  parentPort.postMessage(
    innerHTML(mount, html`<${App} threadId=${threadId} />`)
  );
}, 100);

// End the thread every 2 seconds
setInterval(() => {
  process.exit();
}, 2000);
