import * as xb from 'xrblocks';
import {TimerManager} from './TimerManager';

/** A tool that starts a timer. */
export class StartTimerTool extends xb.Tool {
  constructor(private timerManager: TimerManager) {
    super({
      name: 'startTimer',
      description:
        'Sets a timer for a specified duration, useful for reminders. ' +
        'Returns a timer ID which can be used for additional timer functions such as querying the timer status or receive a callback when the timer is finished. ' +
        'The timer is not automatically shown on the screen.' +
        'Immediately after creating the timer, please call showTimerOnScreen to show the timer on the screen and then call timerCallback to know when the timer is finished.',
      parameters: {
        type: 'OBJECT',
        properties: {
          duration: {
            type: 'NUMBER',
            description: 'The duration of the timer in seconds.',
          },
          name: {
            type: 'STRING',
            description: 'The name of the timer (Optional).',
          },
        },
        required: ['duration'],
      },
    });
  }

  async execute(args: {
    duration: number;
    name?: string;
  }): Promise<xb.ToolResult> {
    const durationInSeconds = args.duration;
    if (durationInSeconds <= 0) {
      return {success: false, data: 'Timer duration must be positive.'};
    }

    const timerId = this.timerManager.startTimer(
      durationInSeconds * 1000,
      args.name,
    );
    console.log('Starting timer:', timerId, 'duration:', durationInSeconds);
    return {
      success: true,
      data: `Timer ${timerId} set for ${durationInSeconds} minutes.`,
    };
  }
}
