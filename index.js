import { innerHTML, html, use } from './node_modules/diffhtml/dist/es/index.js';
import { mainTask, createWorker } from './worker-middleware/index.js';

use(mainTask())

const useWorker = path => {
  const mount = document.createElement('div');
  mount.style.display = 'inline-block';
  createWorker(mount)(path, { type: 'module' });
  return mount;
};

// Use 4 workers

innerHTML(main, html`
  <h1>Workers:</h1>
  ${useWorker('./worker.js')}
  ${useWorker('./worker.js')}
  <hr />
  ${useWorker('./worker.js')}
  ${useWorker('./worker.js')}
`);
