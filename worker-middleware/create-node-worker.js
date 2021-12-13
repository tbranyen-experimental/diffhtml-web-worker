import { Worker } from 'worker_threads';

export const createNodeWorker = (workerPath, onPatches) => {
  return new Worker(workerPath)
    .on('message', patches => {
      console.log('here');
      onPatches(patches);
    })
    .on('exit', () => {
      createNodeWorker(workerPath, onPatches);
    });
};
