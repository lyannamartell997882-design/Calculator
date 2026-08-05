import * as GoogleGenAITypes from '@google/genai';
import * as xb from 'xrblocks';
import {GeminiManager} from 'xrblocks/addons/ai/GeminiManager.js';

/** Manages the integration with Gemini Live. */
export class GlassesGeminiManager extends GeminiManager {
  private screenshotInterval2?: ReturnType<typeof setInterval>;
  private waitingForInput = false;
  private isGeminiSpeaking = false;

  get isIdle() {
    return this.waitingForInput && !this.isGeminiSpeaking;
  }

  override async startGeminiLive() {
    await super.startGeminiLive({
      liveParams: {
        tools: [{googleSearch: {}}],
      },
      model: 'gemini-2.5-flash-native-audio-preview-12-2025',
    });
    this.waitingForInput = true;
  }

  override startScreenshotCapture() {
    this.screenshotInterval2 = setInterval(async () => {
      const base64Image = await xb.core.screenshotSynthesizer.getScreenshot(
        /*overlayOnCamera=*/ true,
      );
      if (base64Image) {
        const base64Data = base64Image.startsWith('data:')
          ? base64Image.split(',')[1]
          : base64Image;
        try {
          xb.core.ai?.sendRealtimeInput?.({
            video: {data: base64Data, mimeType: 'image/png'},
          });
        } catch (error) {
          console.warn(error);
          this.stopGeminiLive();
        }
      }
    }, 1000);
  }

  override handleAIMessage(message: GoogleGenAITypes.LiveServerMessage): void {
    const data = message.data;
    if (data) {
      this.isGeminiSpeaking = true;
    }
    super.handleAIMessage(message);
    if (message.serverContent?.turnComplete === true) {
      this.isGeminiSpeaking = false;
    }
    if (message.serverContent?.waitingForInput !== undefined) {
      this.waitingForInput = message.serverContent.waitingForInput;
    }
  }
}
