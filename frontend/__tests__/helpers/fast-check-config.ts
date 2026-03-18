/**
 * fast-check helper utilities and configuration
 * 
 * This module provides configured fast-check utilities that ensure
 * all property tests run with the minimum required iterations.
 */

import * as fc from 'fast-check';

// Load configuration
const fastCheckConfig = require('../../fast-check.config.js');

/**
 * Configured fc.assert with minimum 100 iterations
 * Use this instead of fc.assert directly to ensure compliance with testing requirements
 */
export const fcAssert = (property: fc.IProperty<unknown>, params?: fc.Parameters<unknown>) => {
  return fc.assert(property, {
    numRuns: fastCheckConfig.numRuns,
    verbose: fastCheckConfig.verbose,
    ...params, // Allow overriding if needed
  });
};

/**
 * Export configured fast-check for convenience
 */
export { fc };

/**
 * Get the default configuration for property tests
 */
export const getDefaultConfig = (): fc.Parameters<unknown> => ({
  numRuns: fastCheckConfig.numRuns,
  verbose: fastCheckConfig.verbose,
  maxSkipsPerRun: fastCheckConfig.maxSkipsPerRun,
});
