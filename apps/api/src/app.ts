import express from 'express';
import cors from 'cors';
import { Prisma, PrismaClient } from '@prisma/client';
import { z } from 'zod';

export function createApp(db: PrismaClient = new PrismaClient()) {
  const app = express();
  app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:5173' }));
  app.use(express.json({ limit: '64kb' }));

  const createSchema = z.object({
    title: z.string().trim().min(3).max(120),
    description: z.string().trim().min(1).max(3000),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).default('MEDIUM')
  });
  const statusSchema = z.object({
    status: z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED']),
    version: z.number().int().min(0)
  });
  const claimSchema = z.object({
    assignee: z.string().trim().min(1).max(80)
  });

  app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

  app.get('/api/tickets', async (req, res, next) => {
    try {
      const status = z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED']).optional().safeParse(req.query.status);
      if (!status.success) return res.status(400).json({ error: 'Invalid status filter' });
      const tickets = await db.ticket.findMany({
        where: status.data ? { status: status.data } : {},
        orderBy: { createdAt: 'desc' },
        take: 100
      });
      return res.json(tickets);
    } catch (error) { return next(error); }
  });

  app.post('/api/tickets', async (req, res, next) => {
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Invalid ticket', details: parsed.error.flatten() });
    const rawKey = req.header('Idempotency-Key');
    const key = rawKey && rawKey.trim() ? rawKey.trim() : null;
    if (key && key.length > 120) return res.status(400).json({ error: 'Idempotency-Key too long' });
    try {
      if (key) {
        const found = await db.ticket.findUnique({ where: { idempotencyKey: key } });
        if (found) {
          if (found.title !== parsed.data.title || found.description !== parsed.data.description || found.priority !== parsed.data.priority) {
            return res.status(409).json({ error: 'Idempotency key reused with different payload' });
          }
          return res.status(200).json(found);
        }
      }
      const ticket = await db.ticket.create({ data: { ...parsed.data, idempotencyKey: key } });
      return res.status(201).json(ticket);
    } catch (error) {
      if (key && error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        const found = await db.ticket.findUnique({ where: { idempotencyKey: key } });
        if (found) {
          if (found.title !== parsed.data.title || found.description !== parsed.data.description || found.priority !== parsed.data.priority) {
            return res.status(409).json({ error: 'Idempotency key reused with different payload' });
          }
          return res.status(200).json(found);
        }
      }
      return next(error);
    }
  });

  app.post('/api/tickets/:id/claim', async (req, res, next) => {
    const parsed = claimSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Invalid assignee' });
    try {
      const updated = await db.ticket.updateMany({
        where: { id: req.params.id, assignee: null, status: 'OPEN' },
        data: { assignee: parsed.data.assignee, status: 'IN_PROGRESS', version: { increment: 1 } }
      });
      if (updated.count === 0) return res.status(409).json({ error: 'Ticket unavailable or already claimed' });
      const ticket = await db.ticket.findUniqueOrThrow({ where: { id: req.params.id } });
      return res.json(ticket);
    } catch (error) { return next(error); }
  });

  app.patch('/api/tickets/:id/status', async (req, res, next) => {
    const parsed = statusSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Invalid status or version' });
    try {
      const updated = await db.ticket.updateMany({
        where: { id: req.params.id, version: parsed.data.version },
        data: { status: parsed.data.status, version: { increment: 1 } }
      });
      if (updated.count === 0) return res.status(409).json({ error: 'Ticket was updated; refresh and retry' });
      return res.json(await db.ticket.findUniqueOrThrow({ where: { id: req.params.id } }));
    } catch (error) { return next(error); }
  });

  app.use((_req, res) => res.status(404).json({ error: 'Route not found' }));
  app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  });
  return app;
}
