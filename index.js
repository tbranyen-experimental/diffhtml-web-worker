import { mainTask } from '/worker-middleware/main-task.js';

const { use, innerHTML } = diff;
const ws = new WebSocket(`ws://${location.host}`);

ws.addEventListener('message', async e => {
  const patches = JSON.parse(e.data);
  innerHTML(main, null, { patches });
});

use(mainTask({ ws }));
