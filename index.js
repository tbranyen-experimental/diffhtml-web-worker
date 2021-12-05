import { innerHTML, html, use } from './node_modules/diffhtml/dist/es/index.js';
import { mainTask, createWorker } from './worker-middleware/index.js';

use(mainTask())

const useWorker = path => {
  const mount = document.createElement('div');
  createWorker(mount)(path, { type: 'module' });
  return mount;
};

innerHTML(main, html`
  <h1>Workers:</h1>
  ${useWorker('./worker.js')}
`);
