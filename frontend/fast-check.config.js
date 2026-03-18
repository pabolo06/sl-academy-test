/**
 * fast-check configuration for property-based testing
 * 
 * This configuration ensures all property tests run with a minimum
 * of 100 iterations to provide adequate coverage.
 */

module.exports = {
  // Minimum number of iterations for each property test
  numRuns: 100,
  
  // Seed for reproducible test runs (can be overridden per test)
  // seed: 42,
  
  // Verbose mode for debugging (set to true to see all generated values)
  verbose: false,
  
  // Maximum number of shrink iterations when a property fails
  maxSkipsPerRun: 100,
  
  // Timeout for each property test (in milliseconds)
  timeout: 5000,
};
