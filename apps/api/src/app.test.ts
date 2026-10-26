import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import { createApp } from './app.js';
import type { PrismaClient } from '@prisma/client';

const fakeTicket = { id: '1', title: 'Test ticket', description: 'Description', priority: 'MEDIUM', status: 'OPEN', assignee: null, version: 0 };
function mockDb() {
  return { ticket: {
    findMany: vi.fn().mockResolvedValue([fakeTicket]),
    findUnique: vi.fn().mockResolvedValue(null),
    create: vi.fn().mockResolvedValue(fakeTicket),
    updateMany: vi.fn().mockResolvedValue({ count: 0 })
  }} as unknown as PrismaClient;
}
describe('OpsFlow API', () => {
  it('returns a health response', async () => {
    const response = await request(createApp(mockDb())).get('/api/health');
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
  });
  it('rejects invalid ticket input', async () => {
    const response = await request(createApp(mockDb())).post('/api/tickets').send({ title: 'x' });
    expect(response.status).toBe(400);
  });
  it('lists tickets', async () => {
    const response = await request(createApp(mockDb())).get('/api/tickets');
    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1);
  });
  it('rejects competing claims', async () => {
    const response = await request(createApp(mockDb())).post('/api/tickets/1/claim').send({ assignee: 'Taylor' });
    expect(response.status).toBe(409);
  });
});
