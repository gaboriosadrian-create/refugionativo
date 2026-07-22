import { NotificationQueueItem, NotificationSettings } from './NotificationTypes';

export class RetryService {
  /**
   * Calculates the next execution timestamp based on retry configuration (e.g., exponential backoff)
   */
  public static calculateNextRetry(
    item: NotificationQueueItem,
    settings: NotificationSettings
  ): string {
    const config = settings.retryConfig || {
      maxAttempts: 3,
      backoffExponential: true,
      initialIntervalSeconds: 30
    };

    const attempt = item.attempts; // Current attempt count
    const initialInterval = config.initialIntervalSeconds;
    
    let secondsToWait = initialInterval;
    if (config.backoffExponential) {
      // Exponential Backoff: interval * 2^(attempt - 1)
      secondsToWait = initialInterval * Math.pow(2, attempt - 1);
    }

    const nextDate = new Date();
    nextDate.setSeconds(nextDate.getSeconds() + secondsToWait);
    
    return nextDate.toISOString();
  }

  /**
   * Determines if a queue item can be retried further
   */
  public static canRetry(item: NotificationQueueItem, settings: NotificationSettings): boolean {
    const maxAttempts = settings.retryConfig?.maxAttempts ?? item.maxAttempts ?? 3;
    return item.attempts < maxAttempts;
  }
}
