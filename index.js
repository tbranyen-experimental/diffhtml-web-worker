import { mainTask } from '/worker-middleware/main-task.js';

const { use, innerHTML } = diff;

use(mainTask());

new WebSocket(`ws://${location.host}`).addEventListener('message', async e => {
  const patches = JSON.parse(e.data);
  innerHTML(main, null, { patches });
});
