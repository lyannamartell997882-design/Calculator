import {css, html, LitElement} from 'lit';
import QRCode from 'qrcode';

/** A button at the bottom left that shows the current URL in a modal. */
export class UrlDisplayButton extends LitElement {
  static override properties = {
    showModal: {type: Boolean},
    qrCodeDataUrl: {type: String},
  };

  static override styles = css`
    :host {
      position: absolute;
      bottom: 20px;
      left: 20px;
      z-index: 1000;
      pointer-events: auto;
    }

    .btn {
      background: rgba(0, 0, 0, 0.6);
      color: white;
      border: 1px solid rgba(255, 255, 255, 0.3);
      padding: 10px 20px;
      border-radius: 9999px;
      cursor: pointer;
      font-family: 'Google Sans', sans-serif;
      font-size: 14px;
      transition: all 0.2s ease;
      backdrop-filter: blur(4px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    }

    .btn:hover {
      background: rgba(0, 0, 0, 0.8);
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(0, 0, 0, 0.3);
    }

    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0, 0, 0, 0.75);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
      backdrop-filter: blur(8px);
    }

    .modal-content {
      background: white;
      color: #1f2937;
      padding: 32px;
      border-radius: 16px;
      max-width: 480px;
      width: calc(100% - 40px);
      word-break: break-all;
      text-align: center;
      box-shadow:
        0 20px 25px -5px rgba(0, 0, 0, 0.1),
        0 10px 10px -5px rgba(0, 0, 0, 0.04);
      animation: modalFadeIn 0.3s ease-out;
    }

    @keyframes modalFadeIn {
      from {
        opacity: 0;
        transform: scale(0.95);
      }
      to {
        opacity: 1;
        transform: scale(1);
      }
    }

    h2 {
      margin-top: 0;
      margin-bottom: 16px;
      font-size: 24px;
      font-weight: 700;
      color: #111827;
    }

    .url-container {
      background: #f3f4f6;
      padding: 16px;
      border-radius: 8px;
      margin-bottom: 24px;
      border: 1px solid #e5e7eb;
    }

    .url-text {
      display: block;
      font-family: 'JetBrains Mono', 'Roboto Mono', monospace;
      font-size: 13px;
      color: #2563eb;
      text-decoration: none;
      line-height: 1.5;
    }

    .url-text:hover {
      text-decoration: underline;
    }

    .qr-container {
      margin-bottom: 24px;
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .qr-image {
      width: 200px;
      height: 200px;
      border: 4px solid #f3f4f6;
      border-radius: 12px;
      padding: 8px;
      background: white;
    }

    .close-btn {
      background: #2563eb;
      color: white;
      border: none;
      padding: 12px 32px;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 600;
      font-size: 16px;
      transition: background 0.2s;
    }

    .close-btn:hover {
      background: #1d4ed8;
    }
  `;

  showModal = false;
  qrCodeDataUrl = '';

  private getGlassesUrl(): string {
    const url = new URL(window.location.href);
    url.searchParams.set('glasses', 'true');
    return url.toString();
  }

  override connectedCallback() {
    super.connectedCallback();
    this.checkUrlParams();
  }

  private checkUrlParams() {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('showqrcode')) {
      this.toggleModal(true);
      // Clean up URL
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('showqrcode');
      window.history.replaceState({}, '', newUrl.toString());
    }
  }

  private async toggleModal(show: boolean) {
    this.showModal = show;
    if (show && !this.qrCodeDataUrl) {
      try {
        this.qrCodeDataUrl = await QRCode.toDataURL(this.getGlassesUrl(), {
          width: 400,
          margin: 2,
        });
      } catch (err) {
        console.error('Failed to generate QR code', err);
      }
    }
  }

  override render() {
    return html`
      <button class="btn" @click=${() => this.toggleModal(true)}>
        Show Page URL
      </button>

      ${this.showModal
        ? html`
            <div class="modal-overlay" @click=${() => this.toggleModal(false)}>
              <div
                class="modal-content"
                @click=${(e: Event) => e.stopPropagation()}>
                <h2>Scan to Connect</h2>

                ${this.qrCodeDataUrl
                  ? html`
                      <div class="qr-container">
                        <img
                          src="${this.qrCodeDataUrl}"
                          alt="QR Code"
                          class="qr-image" />
                        <span
                          class="api-key-label"
                          style="margin-top: 8px; color: #6b7280;"
                          >Scan this QR code with your device to open the
                          experience.</span
                        >
                      </div>
                    `
                  : ''}

                <div class="url-container">
                  <span class="api-key-label" style="color: #1e40af;"
                    >Current URL</span
                  >
                  <a
                    href="${this.getGlassesUrl()}"
                    target="_blank"
                    class="url-text">
                    ${this.getGlassesUrl()}
                  </a>
                </div>
                <button
                  class="close-btn"
                  @click=${() => this.toggleModal(false)}>
                  Close
                </button>
              </div>
            </div>
          `
        : ''}
    `;
  }
}

customElements.define('url-display-button', UrlDisplayButton);
