import { html } from 'diffhtml';

export default function App({ threadId }) {
  return html`
    Current time is ${Date.now()} from worker ${threadId}
  `;
}
