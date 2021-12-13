import { html } from 'diffhtml';
import { createState } from 'diffhtml-components';

const rotate = (time, div) => `rotate(${(time / div) * 360}, 75, 75)`;

function renderClock(time = new Date()) {
  const rotateSeconds = rotate(time.getSeconds() + (time.getMilliseconds() / 1000), 60);
  const rotateMinutes = rotate(time.getMinutes(), 60);
  const rotateHours = rotate(time.getHours(), 12);

  const hourTicks = Array(12).fill(null).map((x, i) => `
    <line x1=75 y1=9 x2=75 y2=18 stroke=#CCC stroke-width=1 transform="${rotate(i, 12)}" />
  `).join('\n');

  return html`
    <svg id="svg" viewbox="-50 -25 250 250" width="250" preserveaspectratio="xMidYMid">
      <circle cx=75 cy=75 r=70 stroke=#555 stroke-width=8 fill=#EFEFEF />
      <line x1=75 y1=75 x2=75 y2=8 stroke=#555 stroke-width=4 transform="${rotateMinutes}" />
      <line x1=75 y1=75 x2=75 y2=30 stroke=#555 stroke-width=4 transform="${rotateHours}" />
      <line x1=75 y1=9 x2=75 y2=1 stroke=#EFEFEF stroke-width=2 transform="${rotateSeconds}" />
      ${html(hourTicks)}
      <circle cx=75 cy=75 r=7 stroke=#555 stroke-width=3 fill=#555 />
    </svg>
  `;
}

export default function App({ threadId }) {
  const [ state, setState ] = createState({
    windowHeight: null,
  });

  // TODO implement function calls and DOM/BOM access, keep hoisted from render
  // to avoid duplication function references.
  async function getWindowHeight() {
    console.log(setState({ windowHeight: 144 }));
  }

  return html`
    <div style=${{ display: 'inline-block' }}>
      <p>workerId: ${threadId}</p>

      ${renderClock(new Date())}

      <p>
        <i>${String(new Date())}</i>
      </p>

      <h3>Do we have window height? ${String(typeof state.windowHeight === 'number')}</h3>

      <!--<form onsubmit=${getWindowHeight}>-->
      <form>
        <button>Get Window Height</button>
      </form>
    </div>
  `;
}
