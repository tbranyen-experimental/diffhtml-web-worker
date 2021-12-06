import { innerHTML, createTree, html, use } from './node_modules/diffhtml/dist/es/index.js';
import './node_modules/diffhtml-components/dist/es/index.js';
import { workerTask, getUUID } from './worker-middleware/index.js';
import App from './app.js';

use(workerTask());

const threadId = getUUID();
const mount = createTree(null);

const render = state => {
  innerHTML(mount, html`
    <${App} threadId=${state.threadId} render=${render} />
  `);
};

render({ threadId });

setInterval(() => render({ threadId }), 1000/60);
