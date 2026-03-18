# Testing Guide

## Overview

This project uses a comprehensive testing strategy that includes:
- **Unit Tests**: Testing specific examples and edge cases with Jest and React Testing Library
- **Property-Based Tests**: Testing universal properties with fast-check
- **End-to-End Tests**: Testing complete user flows with Playwright

## Property-Based Testing with fast-check

### What is Property-Based Testing?

Property-based testing verifies that certain properties (invariants) hold true across a wide range of automatically generated inputs. Instead of writing individual test cases, you define properties that should always be true, and fast-check generates hundreds of test cases to verify them.

### Configuration

fast-check is configured to run a minimum of **100 iterations** per property test. This configuration is defined in:
- `fast-check.config.js` - Main configuration file
- `__tests__/helpers/fast-check-config.ts` - Helper utilities

### Writing Property Tests

#### Basic Example

```typescript
import { fc, fcAssert } from './__tests__/helpers/fast-check-config';

describe('My Component Properties', () => {
  it('Property: some invariant should always hold', () => {
    fcAssert(
      fc.property(fc.string(), (input) => {
        const result = myFunction(input);
        expect(result).toBeDefined();
      })
    );
  });
});
```

#### Using Multiple Generators

```typescript
fcAssert(
  fc.property(
    fc.integer({ min: 0, max: 100 }),
    fc.string({ minLength: 1 }),
    (num, str) => {
      // Test your property with multiple inputs
      expect(myFunction(num, str)).toBeTruthy();
    }
  )
);
```

#### Custom Generators

```typescript
// Generate custom data structures
const userArbitrary = fc.record({
  id: fc.integer({ min: 1 }),
  name: fc.string({ minLength: 1, maxLength: 50 }),
  email: fc.emailAddress(),
  role: fc.constantFrom('manager', 'doctor'),
});

fcAssert(
  fc.property(userArbitrary, (user) => {
    // Test with generated user objects
    expect(validateUser(user)).toBe(true);
  })
);
```

### Available Generators

fast-check provides many built-in generators (arbitraries):

- **Primitives**: `fc.boolean()`, `fc.integer()`, `fc.float()`, `fc.string()`
- **Collections**: `fc.array()`, `fc.set()`, `fc.dictionary()`
- **Complex**: `fc.record()`, `fc.tuple()`, `fc.oneof()`
- **Web**: `fc.emailAddress()`, `fc.webUrl()`, `fc.domain()`
- **Dates**: `fc.date()`, `fc.constantFrom()`

See [fast-check documentation](https://fast-check.dev/docs/core-blocks/arbitraries/) for complete list.

### Property Test Naming Convention

Follow this format for property tests:

```typescript
// Feature: feature-name, Property N: Property Description
it('Property 1: Buttons are always present', () => {
  // **Validates: Requirements 1.1, 1.2**
  fcAssert(/* ... */);
});
```

### Running Tests

```bash
# Run all tests (including property tests)
npm test

# Run tests in CI mode (no watch)
npm run test:ci

# Run specific test file
npx jest path/to/test.test.ts

# Run with verbose output to see generated values
npx jest --verbose
```

### Debugging Failed Properties

When a property test fails, fast-check will:
1. Show the failing input that broke the property
2. Attempt to "shrink" the input to find the minimal failing case
3. Display the seed for reproducibility

Example failure output:
```
Property failed after 42 tests
{ seed: 1234567890, path: "42:0", endOnFailure: true }
Counterexample: ["some", "failing", "input"]
Shrunk 5 time(s)
Got error: Expected true but received false
```

To reproduce the failure:
```typescript
fcAssert(
  fc.property(/* ... */),
  { seed: 1234567890, path: "42:0" }
);
```

### Best Practices

1. **Use fcAssert**: Always use the configured `fcAssert` helper instead of `fc.assert` directly
2. **Meaningful Properties**: Test invariants, not implementation details
3. **Smart Generators**: Constrain generators to valid input ranges
4. **Clear Assertions**: Use descriptive expect messages
5. **Document Requirements**: Link properties to requirements using comments

### Integration with Jest

Property tests work seamlessly with Jest:
- Use standard `describe` and `it` blocks
- Mix property tests with example-based tests
- Use Jest matchers (`expect`) inside properties
- Coverage reports include property tests

### Example: Complete Property Test File

```typescript
import { render, screen } from '@testing-library/react';
import { fc, fcAssert } from './__tests__/helpers/fast-check-config';
import MyComponent from '@/app/my-component';

describe('MyComponent Properties', () => {
  // Property 1: Component always renders without crashing
  it('Property 1: Always renders successfully', () => {
    // **Validates: Requirements 1.1**
    fcAssert(
      fc.property(fc.string(), (text) => {
        const { container } = render(<MyComponent text={text} />);
        expect(container).toBeTruthy();
      })
    );
  });

  // Property 2: Output length never exceeds input length
  it('Property 2: Output is never longer than input', () => {
    // **Validates: Requirements 2.3**
    fcAssert(
      fc.property(fc.string(), (input) => {
        const { container } = render(<MyComponent text={input} />);
        const output = container.textContent || '';
        expect(output.length).toBeLessThanOrEqual(input.length);
      })
    );
  });
});
```

## Unit Testing

Unit tests use Jest and React Testing Library. See existing test files for examples.

## End-to-End Testing

E2E tests use Playwright. See `e2e/` directory for examples.

## Resources

- [fast-check Documentation](https://fast-check.dev/)
- [Jest Documentation](https://jestjs.io/)
- [React Testing Library](https://testing-library.com/react)
- [Playwright Documentation](https://playwright.dev/)
