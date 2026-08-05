import {css, html, LitElement} from 'lit';
import {GlassesPointer} from '../inputs/GlassesTouchpadTypes';

/** A virtual touchpad component for the simulator UI to simulate touch gestures. */
export class VirtualTouchpad extends LitElement {
  static override properties = {
    action: {type: String},
    coordsText: {type: String},
    isDown: {type: Boolean},
  };

  static override styles = css`
    :host {
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 1000;
      pointer-events: auto;
    }

    .touchpad-panel {
      display: flex;
      flex-direction: column;
      padding: 16px;
      width: 320px;
      backdrop-filter: blur(12px);
      background: rgba(15, 23, 42, 0.8);
      border: 1px solid rgba(51, 65, 85, 0.5);
      border-radius: 16px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
      color: white;
      user-select: none;
      font-family: 'Roboto', sans-serif;
      transition: all 0.3s ease;
    }

    .touchpad-panel:hover {
      box-shadow: 0 25px 50px -12px rgba(6, 182, 212, 0.1);
    }

    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 12px;
    }

    .title {
      font-size: 14px;
      font-weight: 600;
      letter-spacing: 0.05em;
      color: #22d3ee;
    }

    .badge {
      padding: 2px 8px;
      font-size: 10px;
      font-family: monospace;
      border-radius: 9999px;
      background: #083344;
      border: 1px solid #155e75;
      color: #67e8f9;
    }

    .virtual-pad {
      position: relative;
      width: 100%;
      aspect-ratio: 523 / 100;
      background: #020617;
      border: 1px solid #1e293b;
      border-radius: 12px;
      overflow: hidden;
      cursor: crosshair;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: border-color 0.2s;
    }

    .virtual-pad:hover {
      border-color: rgba(6, 182, 212, 0.5);
    }

    .grid-overlay {
      position: absolute;
      inset: 0;
      opacity: 0.1;
      background-image:
        linear-gradient(to right, #808080 1px, transparent 1px),
        linear-gradient(to bottom, #808080 1px, transparent 1px);
      background-size: 14px 14px;
      pointer-events: none;
    }

    .radial-overlay {
      position: absolute;
      inset: 0;
      background: radial-gradient(
        ellipse 80% 80% at 50% 50%,
        #0f172a,
        transparent
      );
      pointer-events: none;
    }

    .pointer-dot {
      position: absolute;
      width: 24px;
      height: 24px;
      margin-left: -12px;
      margin-top: -12px;
      border-radius: 50%;
      background: rgba(34, 211, 238, 0.3);
      border: 2px solid #22d3ee;
      pointer-events: none;
      transition: transform 0.075s;
      transform: scale(0);
      box-shadow: 0 0 12px rgba(34, 211, 238, 0.5);
    }

    .pointer-dot.active {
      transform: scale(1);
    }

    .placeholder {
      font-size: 12px;
      color: #64748b;
      font-weight: 500;
      pointer-events: none;
    }

    .placeholder.hidden {
      display: none;
    }

    .debug-log {
      margin-top: 12px;
      font-family: monospace;
      font-size: 11px;
      color: #94a3b8;
      display: flex;
      flex-direction: column;
      gap: 4px;
      border-top: 1px solid #1e293b;
      padding-top: 12px;
    }

    .debug-row {
      display: flex;
      justify-content: space-between;
    }

    .debug-val {
      color: #cbd5e1;
      font-weight: 600;
    }
  `;

  action = '-';
  coordsText = '-';
  isDown = false;
  private dotX = 0;
  private dotY = 0;

  private onMouseDown(e: MouseEvent) {
    this.isDown = true;
    this.updatePointer('DOWN', e.clientX, e.clientY);

    // Add window listeners for dragging outside
    window.addEventListener('mousemove', this.onMouseMoveBound);
    window.addEventListener('mouseup', this.onMouseUpBound);
  }

  private onMouseMoveBound = (e: MouseEvent) => {
    if (!this.isDown) return;
    this.updatePointer('MOVE', e.clientX, e.clientY);
  };

  private onMouseUpBound = (e: MouseEvent) => {
    if (!this.isDown) return;
    this.isDown = false;
    this.updatePointer('UP', e.clientX, e.clientY);

    window.removeEventListener('mousemove', this.onMouseMoveBound);
    window.removeEventListener('mouseup', this.onMouseUpBound);
  };

  private updatePointer(action: string, clientX: number, clientY: number) {
    const pad = this.renderRoot.querySelector('.virtual-pad') as HTMLElement;
    if (!pad) return;

    const rect = pad.getBoundingClientRect();
    let x = ((clientX - rect.left) / rect.width) * 523;
    let y = (1.0 - (clientY - rect.top) / rect.height) * 100;

    x = Math.max(0, Math.min(523, x));
    y = Math.max(0, Math.min(100, y));

    this.dotX = (x / 523) * rect.width;
    this.dotY = (1.0 - y / 100) * rect.height;

    const dot = this.renderRoot.querySelector('.pointer-dot') as HTMLElement;
    if (dot) {
      dot.style.left = `${this.dotX}px`;
      dot.style.top = `${this.dotY}px`;
    }

    this.action = action;
    this.coordsText = `${x.toFixed(1)}, ${y.toFixed(1)}`;

    const detail: {action: string; pointers: GlassesPointer[]} = {
      action,
      pointers: [
        {
          id: 0,
          x: Number(x.toFixed(2)),
          y: Number(y.toFixed(2)),
        },
      ],
    };

    const event = new CustomEvent('glasses-motion-event', {
      detail,
      bubbles: true,
      composed: true,
    });
    window.dispatchEvent(event);
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    window.removeEventListener('mousemove', this.onMouseMoveBound);
    window.removeEventListener('mouseup', this.onMouseUpBound);
  }

  override render() {
    return html`
      <div class="touchpad-panel">
        <div class="header">
          <span class="title">Virtual Touchpad</span>
          <span class="badge">Simulator</span>
        </div>

        <div class="virtual-pad" @mousedown=${this.onMouseDown}>
          <div class="radial-overlay"></div>
          <div class="grid-overlay"></div>
          <div class="pointer-dot ${this.isDown ? 'active' : ''}"></div>
          <span class="placeholder ${this.isDown ? 'hidden' : ''}">
            Drag here to simulate touch
          </span>
        </div>

        <div class="debug-log">
          <div class="debug-row">
            <span>Action:</span>
            <span class="debug-val">${this.action}</span>
          </div>
          <div class="debug-row">
            <span>Coords (X, Y):</span>
            <span class="debug-val">${this.coordsText}</span>
          </div>
        </div>
      </div>
    `;
  }
}

customElements.define('virtual-touchpad', VirtualTouchpad);
