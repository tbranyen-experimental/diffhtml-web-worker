import { Internals } from 'diffhtml';
import { getUUID } from './get-uuid.js';

const { assign } = Object;
const linker = new Map();
const callers = new Map();

export const workerTask = ({
  send,
  getProperty,
}) => assign(function workerTask(transaction) {
  if (!send) { send = postMessage; }

  if (transaction.config.skipWorker) {
    return undefined;
  }

  const currentTasks = transaction.tasks;
  const indexOfPatchNode = currentTasks.indexOf(Internals.tasks.patchNode);

  const link = patches => patches.map(x => {
    // Already found, return.
    if (linker.has(x)) {
      return linker.get(x);
    }

    // If x is a protected VTree (meaning it's used)
    if (Internals.Pool.memory.protected.has(x) || Internals.Pool.memory.allocated.has(x)) {
      // Needs a link added.
      const __link = x === transaction.oldTree ? 'mount' : getUUID();
      const isSvg = transaction.state.svgElements.has(x) || x.nodeName === 'svg';
      const retVal = {
        __link,
        isSvg,
      };

      linker.set(x, retVal);
      x.isSvg = isSvg;
      x.__link = __link;
      return x;
    }

    if (typeof x === 'function') {
      const __caller = getUUID();
      callers.set(__caller, x);
      return { __caller };
    }

    return x;
  });

  // Replace patchNode with skipPatch and return array of patches
  // synchronously
  currentTasks.splice(indexOfPatchNode, 1, function skipPatch() {
    const patches = link(transaction.patches);
    if (typeof send !== 'undefined') {
      send(transaction.config.uuid, patches);
    }
    transaction.end();
    return patches;
  });
}, {
  subscribe: () => {
    global.window = new Proxy({}, {
      get(keyName) {
        return getProperty('window', keyName);
      }
    });
  },

  createTreeHook: (vTree) => {
    for (const attrName in vTree.attributes) {
      if (typeof vTree.attributes[attrName] === 'function') {
        vTree.attributes[attrName] = { __caller: getUUID() };
      }
    }
  },

  releaseHook: vTree => linker.delete(vTree),
});
