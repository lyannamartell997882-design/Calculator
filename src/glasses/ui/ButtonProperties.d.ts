import type {Signal} from '@preact/signals-core';

/** Properties for a button component. */
export interface ButtonProperties {
  text: string | Signal<string>;
  icon?: string | Signal<string>;
}
