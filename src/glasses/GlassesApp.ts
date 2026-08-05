import {reversePainterSortStable} from '@pmndrs/uikit';
import * as THREE from 'three';
import * as xb from 'xrblocks';
import {GlassesInputManager} from './inputs/GlassesInputManager';
import './simulator/ApiKeyModal';
import {ApiKeyModal} from './simulator/ApiKeyModal';
import {GlassesModelManager} from './simulator/GlassesModelManager';
import './simulator/UrlDisplayButton';
import './simulator/VirtualTouchpad';
import {GlassesRenderer} from './ui/GlassesRenderer';
import {SystemUI} from './ui/SystemUI';

function registerSimulatorCameraOverride(this: xb.XRDeviceCamera) {
  this.init();
}

/** Whether the application is running on actual glasses hardware. */
export const RUNNING_IN_GLASSES = xb.getUrlParamBool('glasses', false);

/** Base class for Glasses Applications, handling spatial layout, inputs, and rendering. */
export class GlassesApp extends xb.Script {
  protected runningInXr = false;
  protected systemUiGroup = new THREE.Group();
  protected systemUi!: SystemUI;
  protected glassesRenderer?: GlassesRenderer;
  protected glassesModelManager = new GlassesModelManager();
  protected inputManager = new GlassesInputManager();

  override async init() {
    this.add(this.inputManager);

    this.systemUi = new SystemUI(/*sizeX=*/ 1, /*sizeY=*/ 1);
    this.glassesRenderer = new GlassesRenderer(this.systemUi);
    this.systemUiGroup.add(this.glassesRenderer);
    this.systemUiGroup.position.set(0, 0, -1);
    xb.core.camera.add(this.systemUiGroup);

    if (!RUNNING_IN_GLASSES) {
      this.add(this.glassesModelManager);
    }

    xb.core.renderSceneOverride = this.renderSceneOverride.bind(this);

    if (RUNNING_IN_GLASSES) {
      const aspect = window.innerWidth / window.innerHeight;
      xb.core.camera.fov =
        aspect >= 1 ? 90 : 2 * Math.atan(1 / aspect) * (180 / Math.PI);
      xb.core.camera.updateProjectionMatrix();
      this.systemUiGroup.position.set(0, 0, -0.5);
    }
  }

  protected onSingleXrCamera(camera: THREE.PerspectiveCamera) {
    this.runningInXr = true;
    const projection = camera.projectionMatrix.elements;
    const tanHalfFovV = 1 / projection[5];
    const tanHalfFovH = 1 / projection[0];
    const z = 0.5 / Math.min(tanHalfFovV, tanHalfFovH);
    this.systemUiGroup.position.set(0, 0, -z);
  }

  protected onRightXrCamera(rightCamera: THREE.Camera) {
    this.runningInXr = true;
    xb.add(rightCamera);
    this.glassesModelManager.setXrHeadset(true);
    this.systemUiGroup.position.set(0, 0, -2);
  }

  override update() {
    this.systemUi.update(xb.getDeltaTime());
    const xrCameras = xb.core.renderer.xr.getCamera()
      .cameras as THREE.WebXRCamera[];
    if (xrCameras.length === 2 && !this.runningInXr) {
      this.onRightXrCamera(xrCameras[1]);
    } else if (xrCameras.length === 1 && !this.runningInXr) {
      this.onSingleXrCamera(xrCameras[0]);
    }
  }

  protected renderSceneOverride(
    renderer: THREE.WebGLRenderer,
    scene: THREE.Scene,
    camera: THREE.Camera,
  ) {
    this.glassesRenderer!.render(renderer);
    renderer.render(scene, camera);
  }

  async maybeSpawnApiKeyModal(onKeySubmitted?: () => void) {
    if (window.self !== window.top) {
      return;
    }
    if (
      xb.core.options.ai.gemini.apiKey &&
      xb.core.options.ai.gemini.apiKey !== 'GEMINI_API_KEY' &&
      xb.core.options.ai.gemini.apiKey !== 'MY_GEMINI_API_KEY' &&
      (await xb.core.ai.hasApiKey())
    ) {
      return;
    }
    const apiKeyModal = document.createElement('api-key-modal') as ApiKeyModal;
    apiKeyModal.show = true;
    document.body.appendChild(apiKeyModal);
    apiKeyModal.addEventListener('submit-key', async (e: Event) => {
      const key = (e as CustomEvent).detail.key;
      xb.core.options.ai.gemini.apiKey = key;
      await xb.core.ai.init({aiOptions: xb.core.options.ai});
      onKeySubmitted?.();
    });
  }

  /**
   * Helper to initialize the Three.js and XRBlocks environment.
   */
  static async start(
    app: GlassesApp,
    customizeOptions?: (options: xb.Options) => void,
  ) {
    const options = new xb.Options();
    options.camera.near = 0.001;
    options.reticles.enabled = false;
    options.simulator.instructions.enabled = false;
    options.simulator.handPosePanel.enabled = false;
    options.simulator.renderToRenderTexture = false;
    options.simulator.simulatorSettingsPanel.enabled = false;

    if (customizeOptions) {
      customizeOptions(options);
    }

    if (RUNNING_IN_GLASSES) {
      options.simulator.environments = [];
      options.xrButton.alwaysAutostartSimulator = true;
      document.body.style.backgroundImage = 'none';
      // Disable the simulator camera.
      xb.XRDeviceCamera.prototype.registerSimulatorCamera =
        registerSimulatorCameraOverride;
    } else {
      const urlButton = document.createElement('url-display-button');
      document.body.appendChild(urlButton);
      const touchpad = document.createElement('virtual-touchpad');
      document.body.appendChild(touchpad);
    }

    xb.add(app);
    await xb.init(options);

    // Setup for @pmndrs/uikit.
    const renderer = xb.core.renderer;
    renderer.localClippingEnabled = true;
    renderer.setTransparentSort(reversePainterSortStable);
  }
}
