import * as THREE from 'three';
import * as xb from 'xrblocks';

import {SceneModes} from '../../ConfigurationUI';

const SCENE_360_IMAGE = 'images/bryan-goff-IuyhXAia8EA-unsplash.webp';

/** Manages 360 images and videos in the simulator. */
export class SceneController {
  imageLoaded = false;
  erpMesh: THREE.Mesh<THREE.SphereGeometry, THREE.MeshBasicMaterial> | null =
    null;
  onSceneSelectChangeBounded = this.onSceneSelectChange.bind(this);
  onSceneSourceBounded = this.onSceneSource.bind(this);

  load360Image(source: string) {
    if (this.erpMesh) {
      this.erpMesh.removeFromParent();
      this.erpMesh.material.map?.dispose();
      this.erpMesh.material.dispose();
      this.erpMesh.geometry.dispose();
      this.erpMesh = null;
    }
    const geometry = new THREE.SphereGeometry(400, 60, 40);
    geometry.scale(-1, 1, 1);
    const material = new THREE.MeshBasicMaterial({
      map: new THREE.TextureLoader().load(source),
    });
    this.erpMesh = new THREE.Mesh(geometry, material);
  }

  load360Video(source: string) {
    if (this.erpMesh) {
      this.erpMesh.removeFromParent();
      this.erpMesh.material.map?.dispose();
      this.erpMesh.material.dispose();
      this.erpMesh.geometry.dispose();
      this.erpMesh = null;
    }
    const video = document.createElement('video');
    video.src = source;
    video.play();
    const geometry = new THREE.SphereGeometry(400, 60, 40);
    geometry.scale(-1, 1, 1);
    const material = new THREE.MeshBasicMaterial({
      map: new THREE.VideoTexture(video),
      depthWrite: false,
    });
    this.erpMesh = new THREE.Mesh(geometry, material);
  }

  onSceneSelectChange(event: {sceneMode: SceneModes}) {
    if (event.sceneMode === SceneModes.ENV_360) {
      this.load360Image(SCENE_360_IMAGE);
      xb.add(this.erpMesh!);
    } else {
      console.log('removing erpmesh');
      xb.scene.remove(this.erpMesh!);
    }
  }

  onSceneSource(event: {sourceType: 'image' | 'video'; source: string | File}) {
    const source = event.source;
    if (typeof source === 'string') {
      if (event.sourceType === 'image') {
        this.load360Image(source);
        xb.add(this.erpMesh!);
      } else if (event.sourceType === 'video') {
        this.load360Video(source);
        xb.add(this.erpMesh!);
      }
    } else if (source instanceof File) {
      const file = source;
      console.debug('ouSceneSource, file type:', file.type);
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = () => {
          this.load360Image(reader.result as string);
          xb.add(this.erpMesh!);
        };
        reader.readAsDataURL(file);
      } else if (file.type.startsWith('video/')) {
        const reader = new FileReader();
        reader.onload = () => {
          this.load360Video(reader.result as string);
          xb.add(this.erpMesh!);
        };
        reader.readAsDataURL(file);
      }
    }
  }
}
