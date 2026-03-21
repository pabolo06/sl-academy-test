/**
 * Frontend monitoring and error tracking (Stubbed for deployment).
 * Original Sentry integration disabled to resolve build dependencies.
 */

// import * as Sentry from '@sentry/nextjs' // Disabled

/**
 * Initialize monitoring.
 */
export function initSentry() {
  console.log('Monitoring initialized (Stub).');
}

/**
 * Set user context.
 */
export function setUserContext(userId: string, email?: string, hospitalId?: string) {
  // No-op
}

/**
 * Clear user context.
 */
export function clearUserContext() {
  // No-op
}

/**
 * Capture an exception.
 */
export function captureException(error: Error, context?: Record<string, any>) {
  console.error('[Capture Exception]', error, context);
}

/**
 * Capture a message.
 */
export function captureMessage(message: string, level: string = 'info', context?: Record<string, any>) {
  console.log(`[Capture Message - ${level}]`, message, context);
}

/**
 * Add a breadcrumb.
 */
export function addBreadcrumb(message: string, category: string = 'default', level: string = 'info', data?: Record<string, any>) {
  // console.debug(`[Breadcrumb - ${category}]`, message, data);
}

/**
 * Start a performance transaction.
 */
export function startTransaction(name: string, op: string) {
  return {
    finish: () => { },
    setTag: () => { },
    setData: () => { },
  };
}

/**
 * Track a custom metric.
 */
export function trackMetric(name: string, value: number, tags?: Record<string, string>) {
  // console.log(`[Metric] ${name}: ${value}`, tags);
}

/**
 * Track a page view.
 */
export function trackPageView(path: string, title?: string) {
  // No-op
}

/**
 * Track an API call.
 */
export function trackApiCall(endpoint: string, method: string, status: number, duration: number) {
  // No-op
}

/**
 * Performance monitoring hook.
 */
export function usePerformanceMonitoring(componentName: string) {
  return {
    finish: () => { },
    setTag: () => { },
    setData: () => { },
  };
}

/**
 * Error boundary wrapper.
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: React.ComponentType<{ error: Error; resetError: () => void }>
) {
  // Original implementation returned Sentry.withErrorBoundary
  // Returning the component directly as a stub
  return Component;
}
