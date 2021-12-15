import { Internals } from 'diffhtml';
import { getUUID } from './get-uuid.js';

const { assign } = Object;
const linker = new WeakMap();

export const workerTask = ({
  send,
  callers,
  controller = {},
}) => assign(function workerTask(transaction) {
  if (!send) { send = postMessage; }

  if (transaction.config.skipWorker) {
    return undefined;
  }

  // regen callers on every render to avoid mem leaks.
  //callers.clear();

  const currentTasks = transaction.tasks;
  const indexOfPatchNode = currentTasks.indexOf(Internals.tasks.patchNode);

  const link = patches => patches.map(x => {
    // Already found, return.
    if (linker.has(x)) {
      return linker.get(x);
    }

    if (x && x.__caller) {
      return { __caller: x.__caller };
    }

    if (typeof x === 'function') {
      const __caller = x.__caller || getUUID();
      callers.set(__caller, x);
      x.__caller = __caller;
      return { __caller };
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

      for (const attrName in x.attributes) {
        const val = x.attributes[attrName];

        if (typeof val === 'function') {
          const __caller = val.__caller || getUUID();
          callers.set(__caller, val);
          val.__caller = __caller;
          x.attributes[attrName] = { __caller };
        }
      }

      linker.set(x, retVal);
      x.isSvg = isSvg;
      x.__link = __link;
      return x;
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
    // Set up external api.
    // @ts-ignore
    controller.callFunction = (uuid, caller) => {
      const func = callers.get(caller);

      if (typeof func !== 'function') {
        console.error('Missing func', caller);
      }
      else {
        func();
      }
    };

    // ignore this, just for early testing...
    const window = {
      innerHeight: 144,
    };

    // @ts-ignore
    global.window = new Proxy({}, {
      get: (target, keyName) => {
        return window[keyName];
      },
    });
  },

  //createTreeHook: (vTree) => {
  //  for (const attrName in vTree.attributes) {
  //    const val = vTree.attributes[attrName];

  //    if (val.__caller) {
  //      vTree.attributes[attrName] = { __caller: val.__caller };
  //    }
  //    else if (typeof val === 'function') {
  //      const __caller = getUUID();
  //      vTree.attributes[attrName] = { __caller };
  //      val.__caller = __caller;
  //      callers.set(val, vTree.attributes[attrName]);
  //    }
  //  }
  //},

  releaseHook: vTree => linker.delete(vTree),
});
