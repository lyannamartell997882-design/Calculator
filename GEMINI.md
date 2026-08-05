# Glasses Blocks Development Guide

## Glasses Application Architecture

The project contains a reusable base application class `GlassesApp` (in
[src/glasses/GlassesApp.ts](file:///Users/davili/Documents/xrlabs/arlabs/experimental/glasses-simulator2/src/glasses/GlassesApp.ts))
that handles standard setup for layout, system UI overlays, input handling, 3D
model positioning, and XR rendering loops.

Subclassing `GlassesApp` allows you to focus purely on app-specific features
(e.g., AI assistant managers, tools, prompters) without writing
simulator/rendering boilerplate.

### Key Lifecycle Methods to Override

-   **`init()`**:

    -   Initializes inputs, UI canvas, and 3D simulator models.
    -   *Requirement*: Subclasses must call `await super.init()` to ensure
        standard setup runs successfully.
    -   Use this method to add custom scripts, set up card/UI stack elements,
        and subscribe to input events.

-   **`update()`**:

    -   Called every frame to run UI layout updates and monitor WebXR headsets.
    -   *Requirement*: Subclasses must call `super.update()` to maintain correct
        alignment of overlays in WebXR.

-   **`renderSceneOverride(renderer, scene, camera)`**:

    -   Controls the rendering sequence. By default, it renders the 2D glasses
        interface followed by the 3D scene.
    -   Override this to perform preprocessing (like streaming capturing) before
        final presentation.

-   **`maybeSpawnApiKeyModal(onKeySubmitted?: () => void)`**:

    -   Instance method that presents the `<api-key-modal>` overlay if no key is
        stored, and calls the callback upon completion.

### Bootstrapping a New App

To build a new application:

1.  Create a script (e.g., `src/myApp.ts`) and define a class extending
    `GlassesApp`:

    ```typescript
    import {GlassesApp} from './glasses/GlassesApp';

    class MyCustomApp extends GlassesApp {
      override async init() {
        await super.init();
        // Add custom tools or listen to inputManager here
      }
    }
    ```

2.  Initialize it in a `DOMContentLoaded` event listener by calling
    `GlassesApp.start(appInstance, customizeOptions)`:

    ```typescript
    document.addEventListener('DOMContentLoaded', async () => {
      const app = new MyCustomApp();
      await GlassesApp.start(app, (options) => {
        options.enableCamera();
        options.enableAI();
      });
    });
    ```

## Glasses UI Architecture

The glasses UI (found in `src/glasses/ui/`) is a reactive, 3D spatial user
interface built on top of **`@pmndrs/uikit`** (a Yoga-layout-based UI kit for
Three.js) and **`@preact/signals-core`**.

### 1. Spatial Layout & Rendering

-   **`SystemUI`**: The root container for the interface. It maintains a
    scrollable `canvas` container for dynamic card content and a persistent
    `SystemBar` container.
-   **`GlassesRenderer`**: Responsible for projection and rendering of the
    `SystemUI` canvas within the 3D WebXR camera space.

### 2. Reactivity with Signals

Instead of manual DOM manipulation or full-scene rebuilds, the UI updates
reactively using Preact Signals (`signal`, `computed`):

-   All visual parameters (dimensions, padding, colors, text content, image
    sources) are bound to signals.
-   Changes to signals immediately trigger local WebGL geometry updates and
    layout reflows.
-   Custom effects use `@pmndrs/uikit`'s `abortableEffect` to automatically
    manage the mounting and cleanup of interactive elements (like lists or
    buttons) relative to their parent component lifecycle.

### 3. Working with the Cards UI

The recommended way to present information in the glasses display is using the
`CardManager` and `CardStack` virtualization system.

#### Spawning Generic Text Cards

To create a card dynamically, call `cardManager.createNewCard()`. This returns a
set of reactive preact signals.

> [!IMPORTANT] **Not all fields are required.** You should use as few fields as
> possible to keep the layout clean and readable. Unused signals will
> automatically remain hidden.

```typescript
const {
  cardTitleSignal,
  cardBodySignal,
  cardImageSrcSignal,
  cardActionButtonSignal,
  cardActiveSignal,
} = this.cardManager.createNewCard();

// Populating contents asynchronously (only set what is needed):
cardBodySignal.value = 'Gemini team meeting at 5:00 PM';
```

#### Size & Text Limits

-   Cards are displayed within a viewport that is **420px wide** (scaled to 1
    meter in 3D scene units).
-   **Cumulative Line Limit**: Because the entire card viewport has a restricted
    height, all text fields combined (title, subtitle, body, and action buttons)
    should fit **5 to 7 lines** of text comfortably (using font size 20, line
    height 32px) before clipping occurs. Keep all headers and paragraphs highly
    concise.
-   Images (`imageSrc`) are rendered cover-fitted and flex-grow to fill the top
    section of the card if set. Keep in mind that setting an image further
    reduces the remaining space available for text.

#### Customizing & Adding Custom Card Instances

For complex layouts (like multiple action buttons, custom icons, or subtitles),
you can instantiate a `Card` directly and push it to the virtualized `CardStack`
using `cardManager.addCard(card)`:

```typescript
import {Card} from './glasses/ui/Card';

const card = new Card({
  title: 'Weather Alert',
  subtitle: 'San Francisco',
  body: 'Heavy Rain and wind warnings',
  entityIcon: 'icons/rain.png',
  buttons: [
    {text: 'Dismiss', icon: 'close'},
    {text: 'Details', icon: 'info'},
  ],
});

// Push the card onto the scrollable card stack
this.cardManager.addCard(card);
```

### 4. Creating Completely Custom Spatial UIs

If your application doesn't fit the vertical scrolling card template, you can
design a fully custom UI by attaching elements directly to the root
`systemUi.canvas`:

1.  **Avoid instantiating `CardStack`** or adding it to the canvas.
2.  **Build components using `@pmndrs/uikit`** layout primitives (like
    `Container`, `Text`, `Image`).
3.  **Add them directly** in `init()`:

```typescript
import {Container, Text} from '@pmndrs/uikit';
import {GlassesApp} from './glasses/GlassesApp';

class HUDApp extends GlassesApp {
  override async init() {
    await super.init();

    // Create a 2-column head-up dashboard
    const hudContainer = new Container({
      flexDirection: 'row',
      justifyContent: 'space-between',
      width: '100%',
      height: '100%',
      padding: 24,
    });

    const leftCol = new Container({flexDirection: 'column', gap: 12});
    leftCol.add(
      new Text({text: 'Speed: 25 km/h', fontSize: 24, color: 'white'})
    );
    leftCol.add(new Text({text: 'Battery: 85%', fontSize: 24, color: 'white'}));

    const rightCol = new Container({flexDirection: 'column'});
    rightCol.add(new Text({text: '12:45 PM', fontSize: 24, color: 'white'}));

    hudContainer.add(leftCol);
    hudContainer.add(rightCol);

    // Add to system UI root canvas
    this.systemUi.canvas.add(hudContainer);
  }
}
```

Since the root layout uses Yoga Flexbox, setting width to `100%` and height to
`100%` will automatically scale the custom HUD to fit the display area of the
simulator glasses.

--------------------------------------------------------------------------------

## Glasses Input Architecture

`GlassesInputManager` is a generic, decoupled input manager script added to the
simulator scene. It captures all simulator/glasses input events (from the
keyboard spacebar, physical/virtual touchpads, and XR controllers) and
dispatches unified gestures.

### Available Gestures & Events

`GlassesInputManager` unifies spacebar taps, touchpad motion event sequences,
and XR select signals into the following events:

| Event Name              | Description                                        |
| ----------------------- | -------------------------------------------------- |
| `glasses-click`         | Triggered by a single spacebar tap, a quick tap on |
:                         : the touchpad, or a short XR controller select      :
:                         : gesture.                                           :
| `glasses-doubleclick`   | Triggered by a double tap/select within `500ms`.   |
| `glasses-longpress`     | Triggered by a button hold or touchpad             |
:                         : press-and-hold for `500ms` or longer.              :
| `glasses-swipeforward`  | Triggered by a forward swipe gesture on the        |
:                         : touchpad.                                          :
| `glasses-swipebackward` | Triggered by a backward swipe gesture on the       |
:                         : touchpad.                                          :
| `glasses-swipeup`       | Triggered by an upward swipe gesture on the        |
:                         : touchpad.                                          :

### Raw Touchpad Events

If an application or custom component needs raw pointer coordinates (e.g. for
custom dragging, canvas drawing, or custom gesture detection), they can
subscribe directly to the low-level window event:

-   **Event Name**: `glasses-motion-event`
-   **Type Signature**: `GlassesMotionEvent` (imported from
    `./glasses/inputs/GlassesTouchpadTypes`)
-   **Event Detail Schema**:

    ```typescript
    interface GlassesMotionEvent extends Event {
      detail: {
        action: 'DOWN' | 'MOVE' | 'UP';
        pointers: Array<{id: number; x: number; y: number}>;
      };
    }
    ```

-   **Coordinate Ranges**:

    -   **`x`**: `[0, 523]` (where `0` is the left edge, `523` is the right
        edge).
    -   **`y`**: `[0, 100]` (where `0` is the bottom edge, `100` is the top
        edge).

#### Example Raw Subscription:

```typescript
import {GlassesMotionEvent} from './glasses/inputs/GlassesTouchpadTypes';

window.addEventListener('glasses-motion-event', (e) => {
  const motionEvent = e as GlassesMotionEvent;
  const {action, pointers} = motionEvent.detail;
  if (pointers.length > 0) {
    console.log(`Action: ${action}, X: ${pointers[0].x}, Y: ${pointers[0].y}`);
  }
});
```

--------------------------------------------------------------------------------

### How to Listen for Events

There are two modular ways for your scripts and UI components to subscribe to
these gestures:

#### Option A: Window Event Bus (Decoupled & Recommended)

Because the input manager dispatches these gestures on the global `window`
object as `CustomEvent`s, components do not need a reference to
`GlassesInputManager` directly. You can simply listen to `window`:

```typescript
// Subscribing to scroll gestures in a UI component
override async init() {
  window.addEventListener('glasses-swipeforward', this.handleSwipeForward);
  window.addEventListener('glasses-swipebackward', this.handleSwipeBackward);
}

override dispose() {
  super.dispose();
  window.removeEventListener('glasses-swipeforward', this.handleSwipeForward);
  window.removeEventListener('glasses-swipebackward', this.handleSwipeBackward);
}
```

#### Option B: Input Manager Event Listener

If you have a direct reference to the `GlassesInputManager` instance, you can
subscribe using THREE.js event dispatcher methods:

```typescript
import { GlassesInputManager } from './GlassesInputManager';

// ...
private inputManager = new GlassesInputManager();

override async init() {
  this.add(this.inputManager);
  this.inputManager.addEventListener('glasses-click', this.handleInputClick);
}

override dispose() {
  super.dispose();
  this.inputManager.removeEventListener('glasses-click', this.handleInputClick);
}
```
