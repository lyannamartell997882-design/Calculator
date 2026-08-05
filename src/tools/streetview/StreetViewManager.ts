import {importLibrary, setOptions} from '@googlemaps/js-api-loader';
import * as THREE from 'three';
import * as xb from 'xrblocks';
import {StreetViewViewer} from './StreetViewViewer';

let streetView: google.maps.StreetViewLibrary;

/** Event map for the StreetViewManager. */
export type StreetViewManagerEventMap = THREE.Object3DEventMap & {
  showStreetView: {
    panorama: google.maps.StreetViewPanoramaData;
  };
};

/** Manages the Street View experience, including loading data and the viewer. */
export class StreetViewManager extends xb.Script<StreetViewManagerEventMap> {
  private svs?: google.maps.StreetViewService;
  private viewer = new StreetViewViewer();

  get showingStreetView(): boolean {
    return this.viewer.showingStreetView;
  }

  override async init() {
    const mapsApiKey = xb.getUrlParameter('mapsApiKey') ?? '__MAPS_API_KEY__';
    console.log('maps api key', mapsApiKey);
    if (mapsApiKey.startsWith('__')) {
      console.error('No maps api key available');
    }
    setOptions({
      key: mapsApiKey,
      channel: 'weekly',
    });

    streetView = await importLibrary('streetView');
    this.svs = new streetView.StreetViewService();
    this.add(this.viewer);
  }

  async showStreetView(
    request: google.maps.StreetViewLocationRequest,
    zoom = 4,
  ) {
    const panorama = await this.svs!.getPanorama(request);
    console.log('panorama', panorama);
    await this.viewer.loadStreetView(panorama.data, zoom);
    this.dispatchEvent({type: 'showStreetView', panorama: panorama.data});
    return panorama;
  }

  hideStreetView() {
    this.viewer.hideStreetView();
  }
}
