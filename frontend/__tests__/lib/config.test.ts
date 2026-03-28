describe('lib/config', () => {
  it('exports API_URL with value from env var', () => {
    // jest.setup.js sets NEXT_PUBLIC_API_URL = 'http://localhost:8000'
    const { API_URL } = require('@/lib/config');
    expect(API_URL).toBe('http://localhost:8000');
  });

  it('API_URL is a non-empty string', () => {
    const { API_URL } = require('@/lib/config');
    expect(typeof API_URL).toBe('string');
    expect(API_URL.length).toBeGreaterThan(0);
  });

  it('API_URL starts with http', () => {
    const { API_URL } = require('@/lib/config');
    expect(API_URL).toMatch(/^https?:\/\//);
  });
});
