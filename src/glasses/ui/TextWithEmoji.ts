import {
  BaseOutProperties,
  Container,
  Image,
  InProperties,
  RenderContext,
  Text,
  WithSignal,
} from '@pmndrs/uikit';
import {effect} from '@preact/signals-core';

/**
 * Outgoing properties (output configuration) for the `TextWithEmoji` component.
 * Specifies text styling and options for rendering inline emojis.
 */
export type TextWithEmojiOutProperties = BaseOutProperties & {
  text?: string;
  fontSize?: number;
  lineHeight?: number | string;
  emojiCdn?: 'twemoji' | 'noto-emoji';
  emojiSizeMultiplier?: number;
  emojiOffsetY?: number;
};

/**
 * Incoming properties (input configuration) for the `TextWithEmoji` component.
 * Wraps `TextWithEmojiOutProperties` in signal-aware/reactive types.
 */
export type TextWithEmojiProperties = InProperties<TextWithEmojiOutProperties>;

// Unicode-aware regex to split text into standard words, whitespace, and emoji symbols.
// It matches all emoji presentation sequences (including warning signs, hearts, and sparkles)
// and groups Variation Selectors (\uFE0F), ZWJ Joiners (\u200D), and modifiers with their parent emoji.
const WORD_EMOJI_REGEX =
  /(?:\p{Emoji_Presentation}|\p{Emoji}\uFE0F)(?:\u200D(?:\p{Emoji_Presentation}|\p{Emoji}\uFE0F))*(?:\p{Emoji_Modifier})*|\n|[ \t\r]+|[a-zA-Z0-9]+|[^a-zA-Z0-9\s]/gu;

function getEmojiHex(emoji: string): string {
  let hex = Array.from(emoji)
    .map((char) => char.codePointAt(0)!.toString(16))
    .join('-');
  // Twemoji CDN strips -fe0f from simple emoji codepoints unless it is a ZWJ sequence
  if (!hex.includes('200d') && hex.endsWith('-fe0f')) {
    hex = hex.slice(0, -5);
  }
  return hex;
}

function getEmojiUrl(
  emoji: string,
  provider: 'twemoji' | 'noto-emoji',
): string {
  const hex = getEmojiHex(emoji);
  if (provider === 'noto-emoji') {
    return `https://cdn.jsdelivr.net/gh/googlefonts/noto-emoji/svg/emoji_u${hex}.svg`;
  }
  // Twemoji PNG CDN (72x72 assets, universally supported by Three.js TextureLoader)
  return `https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/72x72/${hex}.png`;
}

/**
 * Renders text with inline emojis supported by CDN-backed SVG/PNG images.
 *
 * It matches emoji presentation sequences and word boundaries to lay out
 * standard text blocks and image representations of emojis inside an inline row.
 * Uses reactive updates to efficiently rebuild or adjust children as properties change.
 */
export class TextWithEmoji extends Container<TextWithEmojiOutProperties> {
  private cleanupEffect?: () => void;

  constructor(
    inputProperties?: InProperties<TextWithEmojiOutProperties>,
    initialClasses?: Array<InProperties<BaseOutProperties> | string>,
    inputConfig?: {
      renderContext?: RenderContext;
      defaultOverrides?: InProperties<TextWithEmojiOutProperties>;
      defaults?: WithSignal<TextWithEmojiOutProperties>;
    },
  ) {
    // Configure the parent container for wrap-around inline flex flow
    super(
      {
        flexDirection: 'row',
        flexWrap: 'wrap',
        alignItems: 'center',
        ...inputProperties,
      } as InProperties<TextWithEmojiOutProperties>,
      initialClasses,
      inputConfig,
    );

    // Reactively rebuild children when the text or sizing properties change
    this.cleanupEffect = effect(() => {
      const currentText = (this.properties.value.text ?? '').replace(
        /\r\n/g,
        '\n',
      );
      const currentFontSize = this.properties.value.fontSize ?? 16;
      const emojiCdn = (this.properties.value.emojiCdn ?? 'twemoji') as
        | 'twemoji'
        | 'noto-emoji';
      const emojiSizeMultiplier =
        this.properties.value.emojiSizeMultiplier ?? 1.05;
      const calculatedEmojiSize = currentFontSize * emojiSizeMultiplier;
      const calculatedEmojiOffsetY =
        this.properties.value.emojiOffsetY ?? -calculatedEmojiSize * 0.08;

      // Parse text into active structural segment tokens
      const segments = currentText.match(WORD_EMOJI_REGEX) || [];
      const activeSegments: Array<{
        type: 'space' | 'newline' | 'emoji' | 'word';
        text: string;
        isConsecutiveNewline?: boolean;
        trailingSpaceWidth?: number;
      }> = [];
      for (let i = 0; i < segments.length; i++) {
        const segment = segments[i];
        if (segment === '\n') {
          const isConsecutiveNewline = i === 0 || segments[i - 1] === '\n';
          activeSegments.push({
            type: 'newline',
            text: segment,
            isConsecutiveNewline,
          });
        } else if (/^[ \t\r]+$/.test(segment)) {
          const prev = activeSegments[activeSegments.length - 1];
          if (prev && (prev.type === 'word' || prev.type === 'emoji')) {
            prev.trailingSpaceWidth = currentFontSize * 0.26 * segment.length;
          } else {
            activeSegments.push({type: 'space', text: segment});
          }
        } else if (
          /(?:\p{Emoji_Presentation}|\p{Emoji}\uFE0F)/u.test(segment)
        ) {
          activeSegments.push({type: 'emoji', text: segment});
        } else {
          const cleanedSegment = segment.replace(/\uFE0F/g, '');
          if (cleanedSegment.length > 0) {
            activeSegments.push({type: 'word', text: cleanedSegment});
          }
        }
      }

      // Check if the existing children list matches the new structural layout segments
      let isCompatible = this.children.length === activeSegments.length;
      if (isCompatible) {
        for (let i = 0; i < this.children.length; i++) {
          const child = this.children[i];
          const seg = activeSegments[i];
          if (
            (seg.type === 'space' || seg.type === 'newline') &&
            !(
              child instanceof Container &&
              !(child instanceof Image) &&
              !(child instanceof Text)
            )
          ) {
            isCompatible = false;
            break;
          }
          if (seg.type === 'emoji' && !(child instanceof Image)) {
            isCompatible = false;
            break;
          }
          if (seg.type === 'word' && !(child instanceof Text)) {
            isCompatible = false;
            break;
          }
        }
      }

      if (isCompatible) {
        // 1. If the structure is compatible, perform extremely fast, flicker-free in-place updates
        for (let i = 0; i < this.children.length; i++) {
          const child = this.children[i];
          const seg = activeSegments[i];
          if (seg.type === 'space') {
            const spaceContainer = child as Container;
            spaceContainer.setProperties({
              width: currentFontSize * 0.26 * seg.text.length,
              height: currentFontSize,
            });
          } else if (seg.type === 'newline') {
            const newlineContainer = child as Container;
            newlineContainer.setProperties({
              width: '100%',
              height: seg.isConsecutiveNewline ? currentFontSize : 0,
            });
          } else if (seg.type === 'emoji') {
            const img = child as Image;
            img.setProperties({
              src: getEmojiUrl(seg.text, emojiCdn),
              width: calculatedEmojiSize,
              height: calculatedEmojiSize,
              transformTranslateY: calculatedEmojiOffsetY,
              marginRight: seg.trailingSpaceWidth,
            });
          } else {
            const txt = child as Text;
            txt.setProperties({
              text: seg.text,
              fontSize: currentFontSize,
              lineHeight: this.properties.value.lineHeight,
              color: this.properties.value.color,
              marginRight: seg.trailingSpaceWidth,
            });
          }
        }
      } else {
        // 2. If structural layout has changed, clean up previous components and rebuild completely

        // Dispose and clear all existing child components safely
        while (this.children.length > 0) {
          const child = this.children[0];
          if (child == null) {
            this.children.shift();
            continue;
          }
          if (
            child instanceof Container ||
            child instanceof Text ||
            child instanceof Image
          ) {
            child.dispose();
          } else {
            this.remove(child);
          }
        }

        // Create and mount the new child elements
        for (const seg of activeSegments) {
          if (seg.type === 'space') {
            const spaceContainer = new Container({
              width: currentFontSize * 0.26 * seg.text.length,
              height: currentFontSize,
            });
            this.add(spaceContainer);
          } else if (seg.type === 'newline') {
            const newlineContainer = new Container({
              width: '100%',
              height: seg.isConsecutiveNewline ? currentFontSize : 0,
            });
            this.add(newlineContainer);
          } else if (seg.type === 'emoji') {
            const img = new Image({
              src: getEmojiUrl(seg.text, emojiCdn),
              width: calculatedEmojiSize,
              height: calculatedEmojiSize,
              keepAspectRatio: true,
              transformTranslateY: calculatedEmojiOffsetY,
              marginRight: seg.trailingSpaceWidth,
            });
            this.add(img);
          } else {
            const txt = new Text({
              text: seg.text,
              fontSize: currentFontSize,
              lineHeight: this.properties.value.lineHeight,
              color: this.properties.value.color,
              whiteSpace: 'pre',
              marginRight: seg.trailingSpaceWidth,
            });
            this.add(txt);
          }
        }
      }
    });
  }

  override dispose(): void {
    if (this.cleanupEffect) {
      this.cleanupEffect();
    }
    super.dispose();
  }
}
