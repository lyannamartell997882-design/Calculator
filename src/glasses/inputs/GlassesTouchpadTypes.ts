/** Represents a pointer coordinate on the glasses touchpad. */
export interface GlassesPointer {
  id: number;
  x: number;
  y: number;
}

/** Custom event interface for touchpad motion events. */
export interface GlassesMotionEvent extends Event {
  detail: {
    action: string;
    pointers: GlassesPointer[];
  };
}
