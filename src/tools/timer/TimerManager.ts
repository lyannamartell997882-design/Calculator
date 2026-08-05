import * as xb from 'xrblocks';
import {CardManager} from '../../glasses/ui/CardManager';

/** Manages multiple timers and their callbacks. */
export class TimerManager {
  private timers: Map<
    string,
    {endTime: number; callbacks: Array<() => void>; name?: string}
  > = new Map();

  constructor(private cardManager: CardManager) {}

  startTimer(durationInMilliseconds: number, name?: string): string {
    const timerId = Math.random().toString(36).substring(2, 9); // Generate a unique ID
    const endTime = Date.now() + durationInMilliseconds;
    const callbacks = [] as Array<() => void>;
    this.timers.set(timerId, {endTime, callbacks, name});

    setTimeout(() => {
      this.timers.delete(timerId);
      callbacks.forEach((callback) => callback());
    }, durationInMilliseconds);

    return timerId;
  }

  getRemainingTime(timerId: string): number | null {
    const timer = this.timers.get(timerId);
    if (timer) {
      return Math.max(0, timer.endTime - Date.now());
    }
    return null;
  }

  cancelTimer(timerId: string): boolean {
    return this.timers.delete(timerId);
  }

  waitForTimerToFinish(timerId: string): Promise<void> {
    return new Promise((resolve) => {
      const timer = this.timers.get(timerId);
      if (!timer) {
        resolve();
        return;
      }

      const callback = () => {
        this.timers.delete(timerId);
        resolve();
      };

      timer.callbacks.push(callback);
    });
  }

  async showTimerOnScreen(timerId: string) {
    const timer = this.timers.get(timerId);
    if (!timer) {
      return;
    }
    const {cardTitleSignal, cardBodySignal, cardActiveSignal} =
      this.cardManager.createNewCard();
    cardTitleSignal.value = timer.name || 'Timer';

    let remainingTime = this.getRemainingTime(timerId);
    while (cardActiveSignal.value && remainingTime != null) {
      const remainingMinutes = Math.floor(remainingTime / 60000)
        .toString()
        .padStart(2, '0');
      const remainingSeconds = Math.floor((remainingTime % 60000) / 1000)
        .toString()
        .padStart(2, '0');
      cardBodySignal.value = `${remainingMinutes}:${remainingSeconds}`;
      await xb.core.waitFrame.waitFrame();
      remainingTime = this.getRemainingTime(timerId);
    }
  }
}
