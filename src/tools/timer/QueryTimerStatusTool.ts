import * as xb from 'xrblocks';
import {TimerManager} from './TimerManager';

/** A tool that queries the status of a timer. */
export class QueryTimerStatusTool extends xb.Tool {
  constructor(private timerManager: TimerManager) {
    super({
      name: 'queryTimerStatus',
      description: 'Queries the remaining time of a previously set timer.',
      parameters: {
        type: 'OBJECT',
        properties: {
          timerId: {
            type: 'STRING',
            description: 'The ID of the timer to query.',
          },
        },
        required: ['timerId'],
      },
    });
  }

  async execute(args: {timerId: string}): Promise<xb.ToolResult> {
    console.log('Getting timer status:', args.timerId);
    const remainingTime = this.timerManager.getRemainingTime(args.timerId);
    if (remainingTime === null) {
      return {success: false, data: 'Timer not found.'};
    }
    if (remainingTime === 0) {
      return {success: true, data: 'Timer has finished.'};
    }
    const remainingSeconds = Math.ceil(remainingTime / 1000);
    return {
      success: true,
      data: `Timer has ${remainingSeconds} seconds remaining.`,
    };
  }
}
