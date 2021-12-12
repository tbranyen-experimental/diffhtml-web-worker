const { Internals } = diff;

const { assign } = Object;
const linker = new Map();

export const mainTask = ({
  // Eventually we'll need to use a service worker to have a partytown-like
  // experience to the UI thread.
  swPath = '/service-worker.js',
} = {}) => assign(function webWorkerTask(transaction) {
  const currentTasks = transaction.tasks;
  const indexOfSyncTrees = currentTasks.indexOf(Internals.tasks.syncTrees);

  // Only run this middleware when patches are present.
  if (!('patches' in transaction.config)) {
    return;
  }

  const link = vTree => {
    if (vTree && vTree.childNodes) {
      Internals.Pool.memory.protected.add(vTree);
      linker.set(vTree.__link, vTree);
      vTree.childNodes.forEach(x => link(x));
    }
  };

  // Replace syncTrees with injectPatches
  currentTasks.splice(indexOfSyncTrees, 1, function injectPatches() {
    transaction.patches = transaction.config.patches.map((x, i) => {
      if (!x || typeof x !== 'object' || !('__link' in x)) {
        return x;
      }

      let vTree = x;

      if (linker.has(x.__link)) {
        vTree = linker.get(x.__link);
        return vTree;
      }
      else if (x.__link === 'mount') {
        vTree = transaction.oldTree;
      }
      else {
        link(vTree);
      }

      if (((x && x.isSvg) || (vTree && vTree.isSvg)) && vTree) {
        transaction.state.svgElements.add(vTree);
      }

      return vTree;

      //if ('__caller' in x) {
      //  const caller = x.__caller;

      //  x = async function(e) {
      //    // tbd handled by synthetic events middleware
      //    e.preventDefault();
      //    e.stopPropagation();

      //    //wrap args

      //    await fetch(`/<function>/${String(caller)}`);
      //    //store & wrap event
      //    //send
      //  };
      //}
    });
  });
}, {
  releaseHook: vTree => {
    if (vTree && vTree.__link) {
      linker.delete(vTree.__link);
    }
  },

  /*
  subscribe() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register(swPath).then(registration => {
        // Registration was successful
        console.log('ServiceWorker registration successful with scope: ', registration.scope);
      }, err => {
        // registration failed :(
        console.log('ServiceWorker registration failed: ', err);
      });
    }
  },
  */
});
