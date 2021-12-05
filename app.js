import { html } from './node_modules/diffhtml/dist/es/index.js';

function getWindowHeight() {
  render({ windowHeight: window.innerHeight });
}

export default function App({ threadId, windowHeight }) {
  return html`
    <div>
      Current time is ${Date.now()} from worker ${threadId}

      <h1>Do we have window height? ${String(typeof windowHeight === 'number')}</h1>

      <form onsubmit=${getWindowHeight}>
        <button>Get Window Height</button>
      </form>
    </div>
  `;
}
