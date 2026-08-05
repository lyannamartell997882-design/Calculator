import * as xb from 'xrblocks';
import {StreetViewManager} from './StreetViewManager';

/** A tool that displays Street View at a specified location. */
export class ShowStreetViewTool extends xb.Tool {
  constructor(private streetViewManager: StreetViewManager) {
    super({
      name: 'showStreetView',
      description:
        'Displays a Street View panorama at a specified location. If no street view is available, an error will be returned. In this case, you can try again with a larger radius.',
      parameters: {
        type: 'OBJECT',
        properties: {
          latitude: {
            type: 'NUMBER',
            description: 'The latitude of the location for Street View.',
          },
          longitude: {
            type: 'NUMBER',
            description: 'The longitude of the location for Street View.',
          },
          radius: {
            type: 'NUMBER',
            description:
              'The radius of the location for Street View in meters. Defaults to 50 meters if not specified.',
          },
        },
        required: ['latitude', 'longitude'],
      },
    });
  }

  async execute(args: {
    latitude: number;
    longitude: number;
    radius?: number;
  }): Promise<xb.ToolResult> {
    console.log(
      'Showing Street View:',
      args.latitude,
      args.longitude,
      args.radius,
    );
    try {
      const panorama = await this.streetViewManager.showStreetView({
        location: {
          lat: args.latitude,
          lng: args.longitude,
        },
        radius: args.radius,
        source: google.maps.StreetViewSource.OUTDOOR,
      });
      const lat = panorama.data.location?.latLng?.lat();
      const lng = panorama.data.location?.latLng?.lng();
      return {
        success: true,
        data: `Street View displayed for latitude ${lat}, longitude ${lng}.`,
      };
    } catch (error) {
      console.error('Failed to show Street View:', error);
      return {
        success: false,
        data: `Failed to display Street View: ${error}`,
      };
    }
  }
}
