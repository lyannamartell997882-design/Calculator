import {Behavior, FunctionResponseScheduling} from '@google/genai';
import * as xb from 'xrblocks';
import {TimerManager} from './TimerManager';

/** A tool that waits for a timer to finish. */
export class TimerCallbackTool extends xb.Tool {
  constructor(private timerManager: TimerManager) {
    super({
      name: 'timerCallback',
      description:
        'Waits for a previously set timer to finish. This is a non-blocking tool which will return the result when the timer has finished.',
      parameters: {
        type: 'OBJECT',
        properties: {
          timerId: {
            type: 'STRING',
            description: 'The ID of the timer to wait for.',
          },
        },
        required: ['timerId'],
      },
      behavior: Behavior.NON_BLOCKING,
    });
  }

  async execute(args: {
    timerId: string;
    scheduling?: 'INTERRUPT' | 'WHEN_IDLE' | 'SILENT';
  }): Promise<xb.ToolResult> {
    console.log(
      'Waiting for the timer to finish:',
      args.timerId,
      args.scheduling,
    );
    const timerId = args.timerId;
    const remainingTime = this.timerManager.getRemainingTime(timerId);

    if (remainingTime === null) {
      return {success: false, data: 'Timer not found.'};
    }

    if (remainingTime === 0) {
      return {success: true, data: 'Timer has already finished.'};
    }

    await this.timerManager.waitForTimerToFinish(timerId);
    const scheduling = FunctionResponseScheduling.INTERRUPT;
    return {
      success: true,
      data: `Timer ${timerId} has finished.`,
      metadata: {scheduling},
    };
  }
}
