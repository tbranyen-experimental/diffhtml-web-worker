import { Internals } from '../node_modules/diffhtml/dist/es/index.js';

const { assign } = Object;
const linker = new Map();

export const mainTask = config => assign(transaction => {
  const currentTasks = transaction.tasks;
  const indexOfSyncTrees = currentTasks.indexOf(Internals.tasks.syncTrees);

  // Only run this middleware when patches are present.
  if (!('patches' in transaction.config)) {
    return;
  }

  // Replace syncTrees with injectPatches
  currentTasks.splice(indexOfSyncTrees, 1, function injectPatches() {
    transaction.patches = transaction.config.patches.map(x => {
      if (x && typeof x === 'object' && '__link' in x) {
        if (linker.has(x.__link)) {
          return linker.get(x.__link);
        }
        else if (x.__link === 'mount') {
          return transaction.oldTree;
        }

        linker.set(x.__link, x);
      }

      return x;
    });
  });
}, {
  releaseHook: vTree => {
    if (vTree && vTree.__link) {
      linker.delete(vTree.__link);
    }
  },
});
