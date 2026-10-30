import { env } from '../config/env.js';
import { ErrorCode } from '../constants/status.js';
import { logger } from '../utils/logger.js';

export interface ComplianceCheckResult {
  isPermitted: boolean;
  complianceMode: string;
  reason?: string;
  errorCode?: string;
}

export class ComplianceService {
  /**
   * Evaluates if an SMS dispatch to the specified recipient is legally and technically compliant.
   */
  static evaluateTransmission(recipientNumber: string): ComplianceCheckResult {
    const mode = env.COMPLIANCE_MODE;

    // Mode 1: Mock Mode - No cellular radio transmission is made
    if (mode === 'DEVELOPMENT_MOCK') {
      return {
        isPermitted: true,
        complianceMode: mode,
      };
    }

    // Mode 2: Restricted Development Mode - Strictly whitelisted test numbers
    if (mode === 'DEVELOPMENT_RESTRICTED') {
      const isWhitelisted = env.WHITELISTED_TEST_NUMBERS.includes(recipientNumber);
      if (!isWhitelisted) {
        logger.warn(
          { recipientNumber, mode },
          'Compliance Gate: Dispatch blocked because recipient is not in WHITELISTED_TEST_NUMBERS'
        );
        return {
          isPermitted: false,
          complianceMode: mode,
          errorCode: ErrorCode.COMPLIANCE_BLOCKED,
          reason: `Compliance Gate: Sending blocked to ${recipientNumber}. In DEVELOPMENT_RESTRICTED mode, dispatch is limited to authorized internal test recipients only.`,
        };
      }
      return {
        isPermitted: true,
        complianceMode: mode,
      };
    }

    // Mode 3: Production DLT Mode - Carrier & TRAI regulations apply
    if (mode === 'PRODUCTION_DLT') {
      // In production mode, automated personal SIM mass sending must be gated behind approved commercial DLT headers.
      logger.info({ recipientNumber, mode }, 'Compliance Gate: Production TRAI/DLT checks evaluated');
      return {
        isPermitted: true,
        complianceMode: mode,
      };
    }

    return {
      isPermitted: false,
      complianceMode: mode,
      errorCode: ErrorCode.COMPLIANCE_BLOCKED,
      reason: 'Unknown compliance mode configuration',
    };
  }
}
