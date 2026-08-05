import {css, html, LitElement} from 'lit';

/** A modal that prompts the user for a Gemini API Key. */
export class ApiKeyModal extends LitElement {
  static override properties = {
    show: {type: Boolean},
    apiKey: {type: String},
  };

  static override styles = css`
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0, 0, 0, 0.85);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      backdrop-filter: blur(10px);
    }

    .modal-content {
      background: #ffffff;
      color: #1f2937;
      padding: 40px;
      border-radius: 24px;
      max-width: 440px;
      width: calc(100% - 40px);
      text-align: center;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
      animation: modalSlideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
    }

    @keyframes modalSlideUp {
      from {
        opacity: 0;
        transform: translateY(20px) scale(0.95);
      }
      to {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }

    h2 {
      margin-top: 0;
      margin-bottom: 12px;
      font-size: 28px;
      font-weight: 800;
      color: #111827;
      letter-spacing: -0.025em;
    }

    p {
      color: #4b5563;
      font-size: 15px;
      line-height: 1.6;
      margin-bottom: 32px;
    }

    .input-group {
      text-align: left;
      margin-bottom: 24px;
    }

    label {
      display: block;
      font-size: 13px;
      font-weight: 600;
      color: #374151;
      margin-bottom: 8px;
      margin-left: 4px;
    }

    input {
      width: 100%;
      padding: 14px 16px;
      border-radius: 12px;
      border: 2px solid #e5e7eb;
      font-family: 'JetBrains Mono', monospace;
      font-size: 14px;
      transition: all 0.2s;
      box-sizing: border-box;
      background: #f9fafb;
    }

    input:focus {
      outline: none;
      border-color: #2563eb;
      background: #ffffff;
      box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.1);
    }

    .submit-btn {
      width: 100%;
      background: #2563eb;
      color: white;
      border: none;
      padding: 16px;
      border-radius: 12px;
      cursor: pointer;
      font-weight: 700;
      font-size: 16px;
      transition: all 0.2s;
      box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.2);
    }

    .submit-btn:hover {
      background: #1d4ed8;
      transform: translateY(-1px);
      box-shadow: 0 10px 15px -3px rgba(37, 99, 235, 0.3);
    }

    .submit-btn:active {
      transform: translateY(0);
    }

    .help-link {
      display: inline-block;
      margin-top: 20px;
      font-size: 13px;
      color: #6b7280;
      text-decoration: none;
      transition: color 0.2s;
    }

    .help-link:hover {
      color: #2563eb;
      text-decoration: underline;
    }
  `;

  show = false;
  apiKey = '';

  private onInput(e: Event) {
    this.apiKey = (e.target as HTMLInputElement).value;
  }

  private onSubmit() {
    if (!this.apiKey.trim()) return;
    this.dispatchEvent(
      new CustomEvent('submit-key', {
        detail: {key: this.apiKey.trim()},
        bubbles: true,
        composed: true,
      }),
    );
    this.show = false;
  }

  override render() {
    if (!this.show) return html``;

    return html`
      <div class="modal-overlay">
        <div class="modal-content">
          <h2>Gemini API Key</h2>
          <p
            >To use the AI features of this simulator, please provide your
            Gemini API Key.</p
          >

          <div class="input-group">
            <label for="api-key">API Key</label>
            <input
              id="api-key"
              type="password"
              placeholder="Enter your API key..."
              .value=${this.apiKey}
              @input=${this.onInput}
              @keydown=${(e: KeyboardEvent) =>
                e.key === 'Enter' && this.onSubmit()} />
          </div>

          <button class="submit-btn" @click=${this.onSubmit}>
            Start Experience
          </button>

          <a
            href="https://aistudio.google.com/app/apikey"
            target="_blank"
            class="help-link">
            Get an API Key from Google AI Studio
          </a>
        </div>
      </div>
    `;
  }
}

customElements.define('api-key-modal', ApiKeyModal);
