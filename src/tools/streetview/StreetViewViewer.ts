import * as THREE from 'three';
import * as xb from 'xrblocks';

const TILE_URL =
  'https://cbks2.google.com/cbk?cb_client=maps_sv.tactile&authuser=0&hl=en&panoid={{PANO_ID}}&output=tile&zoom={{ZOOM}}&x={{X}}&y={{Y}}&1761673564979';

const TILES_W = [1, 2, 4, 7, 13, 26, 1, 2, 4, 8, 16, 32];
const TILES_H = [1, 1, 2, 4, 7, 13, 1, 1, 2, 4, 8, 16];

/** A component that renders a 360-degree Street View panorama. */
export class StreetViewViewer extends xb.Script {
  private sphereMesh?: THREE.Mesh<
    THREE.SphereGeometry,
    THREE.MeshBasicMaterial
  >;

  get showingStreetView(): boolean {
    return this.sphereMesh?.parent === this;
  }

  /**
   * Calculates the number of tiles needed in X and Y for a given zoom level.
   */
  private getTileGridSize(
    zoom: number,
    worldSize: google.maps.Size,
  ): {numX: number; numY: number} {
    if (zoom === 0) return {numX: 1, numY: 1};
    if (worldSize.width / 512 === 26) {
      return {numX: TILES_W[zoom], numY: TILES_H[zoom]};
    }
    // For zoom > 0, the grid is (2^zoom) x (2^(zoom-1))
    const numX = Math.pow(2, zoom);
    const numY = Math.pow(2, zoom - 1);
    return {numX, numY};
  }

  /**
   * Helper utility to load an image and return a promise.
   */
  private loadImage(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      // Required for loading external images into a canvas for WebGL
      img.crossOrigin = 'Anonymous';
      img.onload = () => resolve(img);
      img.onerror = (err) => reject(new Error(`Failed to load image: ${url}`));
      img.src = url;
    });
  }

  async loadStreetView(data: google.maps.StreetViewPanoramaData, zoom = 0) {
    console.log(`Loading street view with zoom level ${zoom}`);
    if (this.sphereMesh == null) {
      this.sphereMesh = new THREE.Mesh(
        new THREE.SphereGeometry(50, 64, 64).scale(-1, 1, 1),
        new THREE.MeshBasicMaterial(),
      );
    }

    // Clean up any old texture
    if (this.sphereMesh.material.map) {
      this.sphereMesh.material.map.dispose();
      this.sphereMesh.material.map = null;
    }

    const pano = data.location?.pano;
    if (!pano) {
      throw new Error('No pano ID available');
    }

    if (zoom === 0) {
      // --- Original behavior for zoom 0 ---
      console.log('Using single-tile zoom=0 fallback');
      const tileUrl = TILE_URL.replace('{{PANO_ID}}', pano)
        .replace('{{ZOOM}}', '0')
        .replace('{{X}}', '0')
        .replace('{{Y}}', '0');
      const texture = await new THREE.TextureLoader().loadAsync(tileUrl);
      texture.repeat.y = 0.5;
      texture.offset.y = 0.5;
      texture.wrapS = THREE.RepeatWrapping;
      this.sphereMesh.material.map = texture;
    } else {
      // --- New stitching behavior for zoom > 0 ---
      const {numX, numY} = this.getTileGridSize(zoom, data.tiles.worldSize);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Could not get 2D canvas context');
      }

      const tileWidth = data.tiles.tileSize.width;
      const tileHeight = data.tiles.tileSize.height;

      canvas.width = numX * tileWidth;
      canvas.height = numY * tileHeight;

      console.log(
        `Stitching ${numX}x${numY} tiles into ${canvas.width}x${canvas.height} texture...`,
      );

      const tilesToLoad: Array<{url: string; x: number; y: number}> = [];
      for (let y = 0; y < numY; y++) {
        for (let x = 0; x < numX; x++) {
          const tileUrl = TILE_URL.replace('{{PANO_ID}}', pano)
            .replace('{{ZOOM}}', zoom.toString())
            .replace('{{X}}', x.toString())
            .replace('{{Y}}', y.toString());
          // Canvas coordinates
          tilesToLoad.push({
            url: tileUrl,
            x: x * tileWidth,
            y: y * tileHeight,
          });
        }
      }

      try {
        // Load all tile images in parallel
        const loadPromises = tilesToLoad.map((tile) =>
          this.loadImage(tile.url),
        );
        const loadedImages = await Promise.all(loadPromises);

        // Draw all loaded images onto the canvas
        console.log('All tiles loaded, drawing to canvas...');
        loadedImages.forEach((img, index) => {
          const tileInfo = tilesToLoad[index];
          ctx.drawImage(img, tileInfo.x, tileInfo.y, tileWidth, tileHeight);
        });

        // Create a single texture from the completed canvas
        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;
        this.sphereMesh.material.map = texture;
        this.sphereMesh.material.needsUpdate = true;
      } catch (error) {
        console.error('Failed to load or stitch one or more tiles:', error);
        throw new Error('Failed to create Street View texture');
      }
    }

    this.showStreetView();
    console.log('Finished loading street view');
  }

  showStreetView() {
    if (this.sphereMesh) {
      this.add(this.sphereMesh);
    }
  }

  hideStreetView() {
    if (this.sphereMesh) {
      this.remove(this.sphereMesh);
    }
  }
}
