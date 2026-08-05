import {css, html, LitElement} from 'lit';

/** Different modes for the simulator scene. */
export enum SceneModes {
  DEFAULT = 0,
  ENV_360 = 1,
  STREET_VIEW = 2,
}

/** A location for Street View. */
export interface StreetViewLocation {
  name: string;
  lat: number;
  lng: number;
}

/** Predefined locations for Street View. */
export const STREET_VIEW_LOCATIONS: StreetViewLocation[] = [
  {name: 'Eiffel Tower', lat: 48.8584, lng: 2.2945},
  {name: 'Times Square', lat: 40.758, lng: -73.9855},
  {name: 'Taj Mahal', lat: 27.1751, lng: 78.0421},
  {name: 'Grand Canyon', lat: 36.0544, lng: -112.1401},
  {name: 'Sydney Opera House', lat: -33.8568, lng: 151.2153},
  {name: 'Colosseum', lat: 41.8902, lng: 12.4922},
  {name: 'Shibuya Crossing', lat: 35.6595, lng: 139.7004},
  {name: 'Golden Gate Bridge', lat: 37.8199, lng: -122.4783},
  {name: 'Pyramids of Giza', lat: 29.9792, lng: 31.1342},
  {name: 'Christ the Redeemer', lat: -22.9519, lng: -43.2105},
];

/** Modes for the camera field of view. */
export enum CameraFovMode {
  MATCH_DISPLAY = 0,
  FIXED = 1,
}

/** Event fired when the simulator scene is changed. */
export class SceneSelectChangeEvent extends Event {
  static type = 'scene-select-change';
  constructor(
    public sceneMode: SceneModes,
    public location?: StreetViewLocation,
  ) {
    super(SceneSelectChangeEvent.type, {bubbles: true, composed: true});
  }
}

/** Event fired when the 360 scene source is changed. */
export class Scene360SourceEvent extends Event {
  static type = 'scene-360-source-event';
  constructor(public source: File) {
    super(Scene360SourceEvent.type, {bubbles: true, composed: true});
  }
}

/** UI for configuring the simulator environment. */
export class GlassesSimulatorConfiguration extends LitElement {
  static override properties = {
    sceneMode: {type: Number},
    cameraFovMode: {type: Number},
    customLat: {type: Number},
    customLng: {type: Number},
  };

  static styles = css`
    :host {
      position: absolute;
      top: 0;
      right: 0;
    }

    .container {
      border: none;
      margin: 1rem;
      border-radius: 1rem;
      background: rgba(0, 0, 0, 0.5);
      color: #fff;
      text-align: center;
      vertical-align: middle;
      line-height: 3rem;
      font-size: 1.2em;
      width: fit-content;
      height: fit-content;
      padding-left: 1rem;
      padding-right: 1rem;
    }
  `;

  sceneMode: SceneModes;
  cameraFovMode: CameraFovMode;
  customLat: number;
  customLng: number;

  constructor() {
    super();
    this.sceneMode = SceneModes.DEFAULT;
    this.cameraFovMode = CameraFovMode.MATCH_DISPLAY;
    this.customLat = 37.7749;
    this.customLng = -122.4194;
  }

  _onSceneSelectChange(event: Event) {
    const selectElement = event.target as HTMLSelectElement;
    const value = selectElement.value;

    if (value === 'custom') {
      this.sceneMode = SceneModes.STREET_VIEW;
      // Don't dispatch yet, wait for "Go"
      this.requestUpdate();
    } else if (value.startsWith('sv_')) {
      this.sceneMode = SceneModes.STREET_VIEW;
      const index = Number(value.substring(3));
      this.dispatchEvent(
        new SceneSelectChangeEvent(
          this.sceneMode,
          STREET_VIEW_LOCATIONS[index],
        ),
      );
    } else {
      this.sceneMode = Number(value) as SceneModes;
      this.dispatchEvent(new SceneSelectChangeEvent(this.sceneMode));
    }
  }

  _onCustomLocationGo() {
    this.dispatchEvent(
      new SceneSelectChangeEvent(SceneModes.STREET_VIEW, {
        name: 'Custom',
        lat: this.customLat,
        lng: this.customLng,
      }),
    );
  }

  _on360SourceChange(event: Scene360SourceEvent) {
    const inputElement = event.target as HTMLInputElement;
    const file = inputElement.files?.[0];
    if (file) {
      this.dispatchEvent(new Scene360SourceEvent(file));
    }
  }

  render() {
    const scene360SourceSelector =
      this.sceneMode === SceneModes.ENV_360
        ? html`<br />
            <input
              type="file"
              @change=${this._on360SourceChange}
              accept="image/*,video/*" /> `
        : html``;

    const customStreetViewInputs =
      this.sceneMode === SceneModes.STREET_VIEW &&
      this.shadowRoot?.querySelector('select')?.value === 'custom'
        ? html`
            <br />
            <input
              type="number"
              .value=${this.customLat}
              @input=${(e: Event) =>
                (this.customLat = Number((e.target as HTMLInputElement).value))}
              placeholder="Lat"
              style="width: 80px" />
            <input
              type="number"
              .value=${this.customLng}
              @input=${(e: Event) =>
                (this.customLng = Number((e.target as HTMLInputElement).value))}
              placeholder="Lng"
              style="width: 80px" />
            <button @click=${this._onCustomLocationGo}>Go</button>
          `
        : html``;
    return html`<div class="container">
      <div>
        <label for="scene-select">Scene:</label>
        <select
          name="scene"
          id="scene-select"
          @change=${this._onSceneSelectChange}>
          <option value=${SceneModes.DEFAULT}>Living Room</option>
          <option value=${SceneModes.ENV_360}>360 Image or Video</option>
          <optgroup label="Street View">
            ${STREET_VIEW_LOCATIONS.map(
              (loc, index) =>
                html`<option value="sv_${index}">${loc.name}</option>`,
            )}
            <option value="custom">Custom...</option>
          </optgroup>
        </select>
        ${scene360SourceSelector} ${customStreetViewInputs}
        ${scene360SourceSelector}
      </div>
    </div>`;
  }
}

customElements.define(
  'glasses-simulator-configuration',
  GlassesSimulatorConfiguration,
);
