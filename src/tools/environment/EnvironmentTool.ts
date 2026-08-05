import * as THREE from 'three';
import * as xb from 'xrblocks';

/** Event fired when the environment is changed. */
export class ChangeEnvironmentEvent {
  type = 'changeEnvironment';
  constructor(public environment: 'passthrough' | '360image' | '360video') {}
}

/** Arguments for the environment tool. */
export interface EnvironmentToolArgs {
  prompt: string;
  environment: 'passthrough' | '360image' | '360video';
}

/** A tool that allows changing the environment. */
export class EnvironmentTool extends xb.Tool {
  eventDispatcher = new THREE.EventDispatcher<{
    changeEnvironment: ChangeEnvironmentEvent;
  }>();

  constructor() {
    super({
      name: 'changeEnvironment',
      description:
        'Change the environment between passthrough, 360 image, or 360 video.',
      parameters: {
        type: 'OBJECT',
        properties: {
          environment: {
            type: 'STRING',
            description: 'Which type of environment to show the user.',
            format: 'enum',
            enum: ['passthrough', '360image', '360video'],
          },
        },
        required: ['environment'],
      },
    });
  }

  async execute(args: EnvironmentToolArgs) {
    const environment = args.environment;
    const eventDispatcher = this.eventDispatcher;
    if (environment === 'passthrough') {
      eventDispatcher.dispatchEvent({
        type: 'changeEnvironment',
        environment: 'passthrough',
      });
      return {
        success: true,
        data: 'Showing passthrough environment',
        metadata: {prompt: args.prompt, timestamp: Date.now()},
      };
    } else if (environment === '360image') {
      eventDispatcher.dispatchEvent({
        type: 'changeEnvironment',
        environment: '360image',
      });
      return {success: true, data: 'Showing 360 image environment.'};
    } else if (environment === '360video') {
      eventDispatcher.dispatchEvent({
        type: 'changeEnvironment',
        environment: '360video',
      });
      return {success: true, data: 'Showing 360 video environment.'};
    }
    return {success: false, data: 'Invalid environment type: ' + environment};
  }
}
