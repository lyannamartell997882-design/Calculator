import * as xb from 'xrblocks';
import {TimerManager} from './TimerManager';

/** A tool that displays a previously set timer on the user's screen. */
export class ShowTimerOnScreen extends xb.Tool {
  constructor(private timerManager: TimerManager) {
    super({
      name: 'showTimerOnScreen',
      description:
        "Displays a previously set timer on the user's screen. The timer will be shown as a card above existing cards.",
      parameters: {
        type: 'OBJECT',
        properties: {
          timerId: {
            type: 'STRING',
            description: 'The ID of the timer to display.',
          },
        },
        required: ['timerId'],
      },
    });
  }

  async execute(args: {timerId: string}): Promise<xb.ToolResult> {
    console.log('Showing timer on screen:', args.timerId);
    const timerId = args.timerId;
    const remainingTime = this.timerManager.getRemainingTime(timerId);

    if (remainingTime === null) {
      return {success: false, data: 'Timer not found.'};
    }

    if (remainingTime === 0) {
      return {success: true, data: 'Timer has already finished.'};
    }

    this.timerManager.showTimerOnScreen(timerId);
    return {
      success: true,
      data: `Timer ${timerId} is now shown on screen.`,
    };
  }
}
