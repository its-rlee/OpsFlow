# Architecture and interview talking points

Browser (React + TypeScript) -> HTTP/JSON -> Express API -> Prisma -> PostgreSQL.

- **Idempotency:** POST /api/tickets accepts Idempotency-Key. A unique index protects against duplicate inserts under concurrent retries; same-key/different-payload requests return 409.
- **Atomic claim:** POST /api/tickets/:id/claim updates the row only if status is OPEN and assignee is NULL. Exactly one concurrent update should succeed.
- **Optimistic locking:** PATCH /api/tickets/:id/status requires the current integer version. A stale version returns 409.
- **Validation:** Zod validates external JSON at the API boundary.
- **Frontend:** React holds filters, form state, selected ticket and server data. It refreshes after mutations.
- **Limitations:** This MVP has no authentication, role-based permissions, audit logging or pagination past 100 recent tickets. Do not expose it publicly with real customer data.
- **Future extensions:** session authentication, cursor pagination, audit event table, integration tests with a real PostgreSQL database, and AI-assisted classification.
