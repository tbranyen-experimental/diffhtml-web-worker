import { Worker, parentPort, workerData } from 'worker_threads';
import { JSDOM } from 'jsdom';
import { Internals, innerHTML, toString, use } from 'diffhtml';
import { mainTask } from './middleware.mjs';

// simulate browser dom for patching diffs
global.document = new JSDOM(`<!DOCTYPE html>`).window.document;

use(mainTask());

const mount = document.createDocumentFragment();

const createWorker = () => new Worker('./worker.mjs')
  .on('message', patches => {
    innerHTML(mount, null, { patches });
    console.log(toString(mount));
  })
  .on('exit', () => {
    createWorker();
  });

createWorker();
