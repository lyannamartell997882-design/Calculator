import * as THREE from 'three';
import type {GLTF} from 'three/addons/loaders/GLTFLoader.js';
import * as xb from 'xrblocks';

const GLASSES_MODEL_FILE =
  'https://cdn.jsdelivr.net/gh/xrblocks/proprietary-assets@main/glasses/glasses_without_lens.glb';

function disposeMaterial(material: THREE.Material): void {
  for (const key in material) {
    if (Object.prototype.hasOwnProperty.call(material, key)) {
      const value = material[key as keyof THREE.Material];
      if (value instanceof THREE.Texture) {
        value.dispose();
      }
    }
  }
  material.dispose();
}

/** Manages the loading, positioning, and disposition of the 3D glasses model in the simulator. */
export class GlassesModelManager extends xb.Script {
  private _modelUrl = GLASSES_MODEL_FILE;

  // Default/Simulator Transform Properties
  defaultPosition = new THREE.Vector3(-0.03, 0.001, -0.005);
  defaultRotation = new THREE.Euler(0, Math.PI, 0);
  defaultScale = new THREE.Vector3(0.05, 0.05, 0.05);

  // WebXR Headset Transform Properties
  xrPosition = new THREE.Vector3(0.0, 0.0, -0.05);
  xrRotation = new THREE.Euler(0, Math.PI, 0);
  xrScale = new THREE.Vector3(0.05, 0.05, 0.05);

  private glassesModel?: GLTF;
  private runningInXrHeadset = false;

  get modelUrl() {
    return this._modelUrl;
  }

  set modelUrl(url: string) {
    if (this._modelUrl !== url) {
      this._modelUrl = url;
      if (this.glassesModel) {
        this.removeAndDisposeModel(this.glassesModel);
        this.glassesModel = undefined;
        this.loadGlassesModel();
      }
    }
  }

  updateTransform() {
    this.positionGlassesModel();
  }

  async init() {
    await this.loadGlassesModel();
  }

  protected async loadGlassesModel() {
    const model = await new xb.ModelLoader().loadGLTF({
      url: this._modelUrl,
      renderer: xb.core.renderer,
    });
    this.glassesModel = model;
    this.positionGlassesModel();
    xb.core.camera.add(model.scene);
    xb.add(xb.core.camera);
  }

  protected positionGlassesModel() {
    const glassesModel = this.glassesModel;
    if (!glassesModel) return;
    if (this.runningInXrHeadset) {
      glassesModel.scene.position.copy(this.xrPosition);
      glassesModel.scene.rotation.copy(this.xrRotation);
      glassesModel.scene.scale.copy(this.xrScale);
    } else {
      glassesModel.scene.position.copy(this.defaultPosition);
      glassesModel.scene.rotation.copy(this.defaultRotation);
      glassesModel.scene.scale.copy(this.defaultScale);
    }
  }

  setXrHeadset(enabled: boolean) {
    if (this.runningInXrHeadset !== enabled) {
      this.runningInXrHeadset = enabled;
      this.positionGlassesModel();
    }
  }

  override update() {
    const xrCameras = xb.core.renderer.xr.getCamera()
      .cameras as THREE.WebXRCamera[];
    this.setXrHeadset(xrCameras.length === 2);
  }

  override dispose() {
    if (this.glassesModel) {
      this.removeAndDisposeModel(this.glassesModel);
    }
  }

  private removeAndDisposeModel(model: GLTF) {
    model.scene.removeFromParent();
    model.scene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        if (child.geometry) {
          child.geometry.dispose();
        }

        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach((mat: THREE.Material) =>
              disposeMaterial(mat),
            );
          } else {
            disposeMaterial(child.material as THREE.Material);
          }
        }
      }
    });
  }

  get model() {
    return this.glassesModel;
  }
}
