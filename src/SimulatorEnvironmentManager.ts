import * as xb from 'xrblocks';
import {
  GlassesSimulatorConfiguration,
  Scene360SourceEvent,
  SceneModes,
  SceneSelectChangeEvent,
} from './ConfigurationUI';
import {
  ChangeEnvironmentEvent,
  EnvironmentTool,
} from './tools/environment/EnvironmentTool';
import {SceneController} from './tools/environment/SceneController';
import {StreetViewManager} from './tools/streetview/StreetViewManager';

const SCENE_360_IMAGE = 'images/bryan-goff-IuyhXAia8EA-unsplash.webp';
const SCENE_360_VIDEO = '/experimental/stereo360/textures/MaryOculus.mp4';

/** Manages the simulator environment, including UI and scene switching. */
export class SimulatorEnvironmentManager extends xb.Script {
  private environmentTool = new EnvironmentTool();
  private sceneController = new SceneController();
  private configUiElement?: GlassesSimulatorConfiguration;

  constructor(
    private streetViewManager: StreetViewManager,
    private setupUi = true,
  ) {
    super();
  }

  async init() {
    this.environmentTool.eventDispatcher.addEventListener(
      'changeEnvironment',
      this.onChangeEnvironmentEvent.bind(this),
    );
    if (this.setupUi) {
      this.setupConfigurationUi();
    }
  }

  private setupConfigurationUi() {
    this.configUiElement = document.createElement(
      'glasses-simulator-configuration',
    ) as GlassesSimulatorConfiguration;
    this.configUiElement.addEventListener(
      SceneSelectChangeEvent.type,
      this.onSceneSelectChange.bind(this) as EventListener,
    );
    this.configUiElement.addEventListener(
      Scene360SourceEvent.type,
      this.sceneController.onSceneSourceBounded as unknown as EventListener,
    );
    document.body.appendChild(this.configUiElement);
  }

  private onChangeEnvironmentEvent(event: ChangeEnvironmentEvent) {
    if (event.environment === 'passthrough') {
      this.configUiElement!.sceneMode = SceneModes.DEFAULT;
      this.onSceneSelectChange(new SceneSelectChangeEvent(SceneModes.DEFAULT));
    } else if (event.environment === '360image') {
      this.configUiElement!.sceneMode = SceneModes.ENV_360;
      this.onSceneSelectChange(new SceneSelectChangeEvent(SceneModes.ENV_360));
      this.sceneController.onSceneSource({
        source: SCENE_360_IMAGE,
        sourceType: 'image',
      });
    } else if (event.environment === '360video') {
      this.configUiElement!.sceneMode = SceneModes.ENV_360;
      this.onSceneSelectChange(new SceneSelectChangeEvent(SceneModes.ENV_360));
      this.sceneController.onSceneSource({
        source: SCENE_360_VIDEO,
        sourceType: 'video',
      });
    }
  }

  private onSceneSelectChange(event: SceneSelectChangeEvent) {
    // 1. Let SceneController handle its part (showing/hiding 360 sphere)
    this.sceneController.onSceneSelectChange(event);

    // 2. Handle Street View
    if (event.sceneMode === SceneModes.STREET_VIEW && event.location) {
      this.streetViewManager.showStreetView({
        location: {lat: event.location.lat, lng: event.location.lng},
        source: google.maps.StreetViewSource.OUTDOOR,
      });
    } else {
      this.streetViewManager.hideStreetView();
    }
  }

  get tool() {
    return this.environmentTool;
  }
}
