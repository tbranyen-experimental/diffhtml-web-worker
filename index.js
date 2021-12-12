import { use, innerHTML } from 'diffhtml';
import { mainTask } from '/worker-middleware/index.js';

use(mainTask());

const ws = new WebSocket('ws://127.0.0.1:8000');
const element = document.createElement('div');

function decodeEntities(string) {
  // If there are no HTML entities, we can safely pass the string through.
  if (!element || !string || !string.indexOf || !string.includes('&')) {
    return string;
  }

  element.innerHTML = string;
  return element.textContent || '';
}

ws.addEventListener('message', async e => {
  const patches = JSON.parse(e.data);
  innerHTML(main, null, { patches });
});
