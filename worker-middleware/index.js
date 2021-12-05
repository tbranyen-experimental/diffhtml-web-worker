import { innerHTML } from '../node_modules/diffhtml/dist/es/index.js';

export const getUUID = () => URL.createObjectURL(new Blob([])).substring(31);

export const createWorker = mount => (path, options) => {
  const worker = new Worker(path, options);

  worker.onmessage = e => {
    innerHTML(mount, null, { patches: e.data });
  };

  worker.onerror = e => {
    console.log(e);
    worker.terminate();
    createWorker(mount)(path, options);
  };

  return worker;
};

export { mainTask } from './main-task.js';
export { workerTask } from './worker-task.js';
