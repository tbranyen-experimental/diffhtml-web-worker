import { Worker } from 'worker_threads';

export const createNodeWorker = (workerPath, onPatches) => {
  return new Worker(workerPath)
    .on('message', patches => {
      onPatches(patches);
    })
    .on('exit', () => {
      console.log('Server worker died, restarting');
      createNodeWorker(workerPath, onPatches);
    });
};
