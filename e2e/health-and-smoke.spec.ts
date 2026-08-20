import { test, expect } from '@playwright/test';

test.describe('E2E Health & Smoke Checks', () => {
  test('Storefront Health API returns 200 OK', async ({ request }) => {
    const response = await request.get('http://localhost:3000/api/health');
    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(body.service).toBe('james-and-sons-storefront');
  });

  test('Admin Health API returns 200 OK', async ({ request }) => {
    const response = await request.get('http://localhost:3001/api/health');
    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(body.service).toBe('james-and-sons-admin');
  });
});
