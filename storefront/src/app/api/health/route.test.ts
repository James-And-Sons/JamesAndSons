import { describe, it, expect, vi } from 'vitest';
import { GET } from './route';

vi.mock('@james-andsons/db', () => ({
  prisma: {
    $queryRaw: vi.fn().mockResolvedValue([{ '?column?': 1 }]),
  },
}));

describe('Storefront Health Check API', () => {
  it('should return 200 OK and health payload when database is healthy', async () => {
    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.service).toBe('james-and-sons-storefront');
    expect(data.status).toBe('OK');
    expect(data.checks.database.status).toBe('healthy');
    expect(typeof data.responseTimeMs).toBe('number');
  });
});
