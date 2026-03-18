/**
 * Type definitions for property-based testing
 */

import * as fc from 'fast-check';

/**
 * Configuration options for property tests
 */
export interface PropertyTestConfig extends fc.Parameters<unknown> {
  numRuns?: number;
  verbose?: boolean;
  maxSkipsPerRun?: number;
  timeout?: number;
  seed?: number;
  path?: string;
}

/**
 * Common arbitraries for testing React components
 */
export interface ComponentArbitraries {
  // User role types
  userRole: fc.Arbitrary<'manager' | 'doctor'>;
  
  // Common string patterns
  nonEmptyString: fc.Arbitrary<string>;
  shortString: fc.Arbitrary<string>;
  longString: fc.Arbitrary<string>;
  
  // URLs and routes
  loginRoute: fc.Arbitrary<string>;
  
  // CSS classes
  cssClass: fc.Arbitrary<string>;
}

/**
 * Helper type for property test functions
 */
export type PropertyTest<T extends unknown[]> = (...args: T) => void | boolean;
