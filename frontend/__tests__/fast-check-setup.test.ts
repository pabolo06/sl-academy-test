/**
 * fast-check setup verification test
 * 
 * This test verifies that fast-check is properly configured and integrated with Jest.
 * It serves as a smoke test for the property-based testing infrastructure.
 */

import { fc, fcAssert, getDefaultConfig } from './helpers/fast-check-config';

describe('fast-check setup', () => {
  it('should be properly configured with minimum 100 iterations', () => {
    const config = getDefaultConfig();
    expect(config.numRuns).toBe(100);
  });

  it('should run property tests with configured iterations', () => {
    // Simple property: reversing an array twice returns the original array
    fcAssert(
      fc.property(fc.array(fc.integer()), (arr) => {
        const reversed = [...arr].reverse();
        const doubleReversed = [...reversed].reverse();
        expect(doubleReversed).toEqual(arr);
      })
    );
  });

  it('should support custom generators', () => {
    // Property: string length is always non-negative
    fcAssert(
      fc.property(fc.string(), (str) => {
        expect(str.length).toBeGreaterThanOrEqual(0);
      })
    );
  });

  it('should support multiple arbitraries', () => {
    // Property: addition is commutative
    fcAssert(
      fc.property(fc.integer(), fc.integer(), (a, b) => {
        expect(a + b).toBe(b + a);
      })
    );
  });
});
