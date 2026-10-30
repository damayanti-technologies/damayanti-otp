import { logger } from '../utils/logger.js';
import { env } from '../config/env.js';

export interface MockSmsRecord {
  recipient: string;
  message: string;
  correlationId: string;
  timestamp: string;
}

class SmsMockService {
  private dispatches: MockSmsRecord[] = [];

  /**
   * Records a mock SMS dispatch for development & test environments.
   */
  async dispatchMockSms(recipient: string, message: string, correlationId: string): Promise<boolean> {
    const record: MockSmsRecord = {
      recipient,
      message,
      correlationId,
      timestamp: new Date().toISOString(),
    };

    this.dispatches.push(record);

    if (env.NODE_ENV !== 'test') {
      logger.info(
        {
          recipient,
          correlationId,
          mode: 'DEVELOPMENT_MOCK',
        },
        '📱 [MOCK SMS DISPATCHED] Simulated carrier delivery accepted.'
      );
    }

    return true;
  }

  /**
   * Retrieves the last mock SMS dispatched to a phone number (TEST/DEV ONLY).
   */
  getLastDispatched(recipient: string): MockSmsRecord | undefined {
    return [...this.dispatches].reverse().find((d) => d.recipient === recipient);
  }

  /**
   * Clears in-memory mock history.
   */
  clear(): void {
    this.dispatches = [];
  }
}

export const smsMockService = new SmsMockService();
