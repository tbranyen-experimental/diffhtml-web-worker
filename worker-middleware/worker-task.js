import { Internals } from '../node_modules/diffhtml/dist/es/index.js';
export const getUUID = () => URL.createObjectURL(new Blob([])).substring(31);

const { assign } = Object;
const linker = new Map();

export const workerTask = config => assign(transaction => {
  const currentTasks = transaction.tasks;
  const indexOfPatchNode = currentTasks.indexOf(Internals.tasks.patchNode);

  const link = patches => patches.map(x => {
    // Already found, return.
    if (linker.has(x)) {
      return { __link: linker.get(x) };
    }

    // If x is a protected VTree (meaning it's used)
    if (Internals.Pool.memory.protected.has(x) || Internals.Pool.memory.allocated.has(x)) {
      // Needs a link added.
      x.__link = x === transaction.oldTree ? 'mount' : getUUID();
      linker.set(x, x.__link);
    }

    if (typeof x === 'function') {
      x = { __caller: getUUID() };
    }

    return x;
  });

  // Replace patchNode with skipPatch and return array of patches
  // synchronously
  currentTasks.splice(indexOfPatchNode, 1, function skipPatch() {
    transaction.end();
    const patches = link(transaction.patches);
    postMessage(patches);
    return patches;
  });
}, {
  createTreeHook: (vTree) => {
    for (const attrName in vTree.attributes) {
      if (typeof vTree.attributes[attrName] === 'function') {
        vTree.attributes[attrName] = { __caller: getUUID() };
      }
    }
  },

  releaseHook: vTree => linker.delete(vTree),

  subscribe: () => {
    //window = new Proxy({}, 
  },
});
