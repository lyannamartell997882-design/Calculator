import 'temporal-polyfill/global';
import * as THREE from 'three';
import * as xb from 'xrblocks';
import {GlassesTouchpadGestureDetector} from './GlassesTouchpadGestureDetector';
import {GlassesMotionEvent} from './GlassesTouchpadTypes';

const SPACE_BAR_KEY_CODE = 32;

/** Event map for the GlassesInputManager. */
export type GlassesInputManagerEventMap = THREE.Object3DEventMap & {
  'glasses-click': {type: 'glasses-click'};
  'glasses-doubleclick': {type: 'glasses-doubleclick'};
  'glasses-longpress': {type: 'glasses-longpress'};
  'glasses-swipeforward': {type: 'glasses-swipeforward'};
  'glasses-swipebackward': {type: 'glasses-swipebackward'};
  'glasses-swipeup': {type: 'glasses-swipeup'};
};

/** Manages input for the glasses simulator, dispatching unified gestures. */
export class GlassesInputManager extends xb.Script<GlassesInputManagerEventMap> {
  private lastSelectStartTime = Temporal.Instant.fromEpochMilliseconds(0);
  private longPressTriggered = false;
  private spacebarPressed = false;

  private gestureDetector = new GlassesTouchpadGestureDetector(
    /*touchSlop=*/ undefined,
    /*swipeDistanceRatio=*/ undefined,
    /*swipeVelocityThreshold=*/ undefined,
    /*enableSwipeUp=*/ true,
  );

  constructor() {
    super();
  }

  override async init() {
    document.addEventListener('keydown', this.handleKeyDown);
    document.addEventListener('keyup', this.handleKeyUp);
    window.addEventListener('glasses-motion-event', this.handleMotionEvent);
  }

  override dispose() {
    super.dispose();
    document.removeEventListener('keydown', this.handleKeyDown);
    document.removeEventListener('keyup', this.handleKeyUp);
    window.removeEventListener('glasses-motion-event', this.handleMotionEvent);
  }

  private handleKeyDown = (event: KeyboardEvent) => {
    if (event.code === 'Space' || event.keyCode === SPACE_BAR_KEY_CODE) {
      if (!this.spacebarPressed) {
        this.spacebarPressed = true;
        this.onSelectStart();
      }
    }
  };

  private handleKeyUp = (event: KeyboardEvent) => {
    if (event.code === 'Space' || event.keyCode === SPACE_BAR_KEY_CODE) {
      this.spacebarPressed = false;
      this.onSelectEnd();
    }
  };

  private handleMotionEvent = (event: Event) => {
    const data = event as GlassesMotionEvent;
    const gesture = this.gestureDetector.processEvent(data);
    if (gesture) {
      if (gesture === 'click') {
        this.triggerClickEvent();
      } else if (gesture === 'swipe_forward') {
        this.dispatchGlassesEvent('glasses-swipeforward');
      } else if (gesture === 'swipe_backward') {
        this.dispatchGlassesEvent('glasses-swipebackward');
      } else if (gesture === 'swipe_up') {
        this.dispatchGlassesEvent('glasses-swipeup');
      }
    }
  };

  override update() {
    if (this.spacebarPressed) {
      this.onSelecting();
    }
  }

  override async onSelectStart() {
    const now = Temporal.Now.instant();
    const durationSinceLastSelect = now.since(this.lastSelectStartTime);
    const doublePressDuration = Temporal.Duration.from({milliseconds: 500});

    if (
      Temporal.Duration.compare(durationSinceLastSelect, doublePressDuration) <
      0
    ) {
      this.dispatchGlassesEvent('glasses-doubleclick');
    } else {
      this.dispatchGlassesEvent('glasses-click');
    }

    this.lastSelectStartTime = now;
  }

  override onSelecting() {
    const now = Temporal.Now.instant();
    const elapsedTime = now.since(this.lastSelectStartTime).milliseconds;
    if (!this.longPressTriggered && elapsedTime >= 500) {
      this.longPressTriggered = true;
      this.dispatchGlassesEvent('glasses-longpress');
    }
  }

  override onSelectEnd() {
    this.longPressTriggered = false;
  }

  private triggerClickEvent() {
    const now = Temporal.Now.instant();
    const durationSinceLastSelect = now.since(this.lastSelectStartTime);
    const doublePressDuration = Temporal.Duration.from({milliseconds: 500});

    if (
      Temporal.Duration.compare(durationSinceLastSelect, doublePressDuration) <
      0
    ) {
      this.dispatchGlassesEvent('glasses-doubleclick');
    } else {
      this.dispatchGlassesEvent('glasses-click');
    }

    this.lastSelectStartTime = now;
  }

  private dispatchGlassesEvent<K extends keyof GlassesInputManagerEventMap>(
    type: K,
  ) {
    this.dispatchEvent({type} as THREE.BaseEvent);
    window.dispatchEvent(
      new CustomEvent(type as string, {
        bubbles: true,
        composed: true,
      }),
    );
  }
}
