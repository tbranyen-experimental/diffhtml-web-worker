import { Internals, createTree } from 'diffhtml';

// Use a simple counter for each unique VTree.
let counter = 0;
const linker = new Map();

export const workerTask = config => transaction => {
  const currentTasks = transaction.tasks;
  const indexOfPatchNode = currentTasks.indexOf(Internals.tasks.patchNode);

  const link = patches => patches.map(x => {
    if (linker.has(x)) {
      return { __link: linker.get(x) };
    }

    // If x is a protected VTree (meaning it's used)
    if (Internals.Pool.memory.protected.has(x) || Internals.Pool.memory.allocated.has(x)) {
      // Needs a link added.
      x.__link = x === transaction.oldTree ? 'mount' : counter++;
      linker.set(x, x.__link);
    }

    return x;
  });

  // Replace patchNode with skipPatch and return array of patches
  // synchronously
  currentTasks.splice(indexOfPatchNode, 1, function skipPatch() {
    transaction.end();
    return link(transaction.patches);
  });
};

workerTask.releaseHook = vTree => linker.delete(vTree);

export const mainTask = config => transaction => {
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
          linker.set('mount', x);
          return transaction.oldTree;
        }

        linker.set(x.__link, x);
      }

      return x;
    });
  });
};

mainTask.releaseHook = vTree => {
  if (vTree && vTree.__link) {
    linker.delete(vTree.__link);
  }
};
