import {GlassesMotionEvent} from './GlassesTouchpadTypes';

interface Point {
  x: number;
  y: number;
  time: number;
}

/** Detects gestures (clicks, swipes) on the virtual/physical touchpad. */
export class GlassesTouchpadGestureDetector {
  private initialPosition: Point | null = null;
  private previousValidPositionX = 0;
  private previousValidPositionY = 0;
  private totalHorizontalDistanceTraveled = 0;
  private totalVerticalDistanceTraveled = 0;
  private ignoreClickForGestureStream = false;
  private ignoreSwipeForGestureStream = false;
  private ignoreVerticalSwipeForGestureStream = false;
  private history: Point[] = [];

  constructor(
    private readonly touchSlop = 15,
    private readonly swipeDistanceRatio = 1.3,
    private readonly swipeVelocityThreshold = 34, // units per second
    private readonly enableSwipeUp = false,
  ) {}

  /**
   * Processes a motion event and returns the detected gesture on 'UP' action.
   */
  processEvent(
    event: GlassesMotionEvent,
  ): 'click' | 'swipe_forward' | 'swipe_backward' | 'swipe_up' | null {
    const detail = event.detail;
    if (!detail) return null;

    const action = detail.action;
    const pointers = detail.pointers;

    if (!pointers || pointers.length === 0) {
      this.reset();
      return null;
    }

    const primaryPointer = pointers[0];
    const {x, y} = primaryPointer;
    const now = performance.now();

    if (action === 'DOWN') {
      this.initialPosition = {x, y, time: now};
      this.previousValidPositionX = x;
      this.previousValidPositionY = y;
      this.totalHorizontalDistanceTraveled = 0;
      this.totalVerticalDistanceTraveled = 0;
      this.ignoreClickForGestureStream = false;
      this.ignoreSwipeForGestureStream = false;
      this.ignoreVerticalSwipeForGestureStream = false;
      this.history = [{x, y, time: now}];
      return null;
    }

    if (!this.initialPosition) {
      return null;
    }

    if (action === 'MOVE') {
      const dx = x - this.previousValidPositionX;
      const dy = y - this.previousValidPositionY;
      this.totalHorizontalDistanceTraveled += Math.abs(dx);
      this.totalVerticalDistanceTraveled += Math.abs(dy);
      this.previousValidPositionX = x;
      this.previousValidPositionY = y;
      this.history.push({x, y, time: now});

      // Clean up old history (> 200ms) to save memory
      while (this.history.length > 0 && now - this.history[0].time > 200) {
        this.history.shift();
      }

      // Check horizontal backtracking
      const displacementX = x - this.initialPosition.x;
      if (
        Math.abs(
          this.totalHorizontalDistanceTraveled - Math.abs(displacementX),
        ) > this.touchSlop
      ) {
        this.ignoreSwipeForGestureStream = true;
      }

      // Check vertical backtracking
      const displacementY = y - this.initialPosition.y;
      if (
        Math.abs(this.totalVerticalDistanceTraveled - Math.abs(displacementY)) >
        this.touchSlop
      ) {
        this.ignoreVerticalSwipeForGestureStream = true;
      }

      // Check click region displacement
      const distSq =
        displacementX * displacementX + displacementY * displacementY;
      if (distSq > this.touchSlop * this.touchSlop) {
        this.ignoreClickForGestureStream = true;
      }

      return null;
    }

    if (action === 'UP') {
      let detectedGesture:
        | 'click'
        | 'swipe_forward'
        | 'swipe_backward'
        | 'swipe_up'
        | null = null;

      if (!this.ignoreClickForGestureStream) {
        detectedGesture = 'click';
      } else {
        const finalDisplacementX = x - this.initialPosition.x;
        const finalDisplacementY = y - this.initialPosition.y;
        const absX = Math.abs(finalDisplacementX);
        const absY = Math.abs(finalDisplacementY);
        const swipeDistanceThreshold = this.touchSlop * this.swipeDistanceRatio;

        if (absX > absY) {
          // Horizontal swipe is dominant
          if (
            !this.ignoreSwipeForGestureStream &&
            absX > swipeDistanceThreshold
          ) {
            const velocity = this.calculateHorizontalVelocity(x, now);
            if (Math.abs(velocity) >= this.swipeVelocityThreshold) {
              detectedGesture =
                finalDisplacementX > 0 ? 'swipe_forward' : 'swipe_backward';
            }
          }
        } else if (this.enableSwipeUp) {
          // Vertical swipe is dominant and upward motion is detected (excluding swipe_down)
          if (
            !this.ignoreVerticalSwipeForGestureStream &&
            finalDisplacementY > swipeDistanceThreshold
          ) {
            const velocity = this.calculateVerticalVelocity(y, now);
            if (velocity >= this.swipeVelocityThreshold) {
              detectedGesture = 'swipe_up';
            }
          }
        }
      }

      this.reset();
      return detectedGesture;
    }

    return null;
  }

  private calculateHorizontalVelocity(
    currentX: number,
    currentTime: number,
  ): number {
    if (this.history.length < 2) return 0;
    const timeLimit = currentTime - 100;
    let oldPoint = this.history[0];
    for (const p of this.history) {
      if (p.time >= timeLimit) {
        oldPoint = p;
        break;
      }
    }
    const dt = (currentTime - oldPoint.time) / 1000;
    if (dt <= 0) return 0;
    return (currentX - oldPoint.x) / dt;
  }

  private calculateVerticalVelocity(
    currentY: number,
    currentTime: number,
  ): number {
    if (this.history.length < 2) return 0;
    const timeLimit = currentTime - 100;
    let oldPoint = this.history[0];
    for (const p of this.history) {
      if (p.time >= timeLimit) {
        oldPoint = p;
        break;
      }
    }
    const dt = (currentTime - oldPoint.time) / 1000;
    if (dt <= 0) return 0;
    return (currentY - oldPoint.y) / dt;
  }

  private reset() {
    this.initialPosition = null;
    this.history = [];
    this.totalHorizontalDistanceTraveled = 0;
    this.totalVerticalDistanceTraveled = 0;
    this.previousValidPositionX = 0;
    this.previousValidPositionY = 0;
    this.ignoreClickForGestureStream = false;
    this.ignoreSwipeForGestureStream = false;
    this.ignoreVerticalSwipeForGestureStream = false;
  }
}
