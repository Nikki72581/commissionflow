# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev              # Start dev server (Turbopack)
npm run build            # prisma generate + next build
npm run lint             # ESLint
npm run db:seed          # Seed database with demo data

# Testing
npm run test:unit        # Run unit tests (Vitest)
npm run test:integration # Run integration tests
npm run test:watch       # Watch mode during development
npm run test:coverage    # Generate coverage report (80% threshold)
npm run test:e2e         # Run Playwright E2E tests
npm run test:all         # Run unit + integration + E2E

# Run a single test file
npx vitest run tests/unit/commission-calculations.test.ts

# Database
npx prisma generate      # Regenerate client after schema changes
npx prisma db push       # Sync schema to database (dev)
npx prisma studio        # GUI for inspecting the database
```

## Architecture

### Source Layout

All application code lives in `src/`. The `@/` alias maps to `src/`.

```
src/
├── app/                    # Next.js App Router
│   ├── actions/            # Next.js Server Actions (data mutations)
│   ├── api/
│   │   ├── v1/             # External REST API (API-key auth)
│   │   ├── acumatica/      # Acumatica webhook/sync endpoints
│   │   ├── webhooks/       # Clerk webhooks
│   │   └── dashboard/      # Internal API routes
│   └── dashboard/          # Authenticated pages (admin + salesperson views)
├── actions/integrations/   # Server actions specific to integrations
├── components/             # React components (organized by feature)
├── hooks/                  # Custom React hooks
├── lib/                    # Shared utilities and services
│   ├── acumatica/          # Acumatica API client + sync logic
│   └── validations/        # Zod schemas
└── types/                  # TypeScript type definitions
```

### Two Distinct API Layers

1. **Server Actions** (`src/app/actions/`) — Used by the Next.js UI. All mutating operations go through here. Each action file corresponds to a domain entity (clients, sales, commissions, etc.).

2. **External REST API** (`src/app/api/v1/`) — For third-party integrations. Protected by API keys (Bearer token). Uses `withApiAuth()` from `src/lib/api-middleware.ts` which handles auth, rate limiting, scope checking, and usage logging automatically.

### Auth & Multi-tenancy

- **Clerk** handles authentication. `src/lib/auth.ts` provides `getCurrentUserWithOrg()` and `requireAdmin()` helpers used at the top of every server action and page.
- Every database record is scoped to an `organizationId`. All queries must filter by org to prevent data leaks between tenants.
- Users have two roles: `ADMIN` (full access) and `SALESPERSON` (limited to own data via `/dashboard/my-commissions`).
- New users are directed to `/onboarding` where their DB record is created.
- `src/lib/features.ts` controls feature gating (currently all features are enabled while Clerk billing is configured).

### Database

- **Prisma** ORM with PostgreSQL. Schema at `prisma/schema.prisma`.
- The `src/lib/db.ts` singleton supports schema-per-branch: non-`main` Vercel preview deployments automatically use a separate PostgreSQL schema (derived from branch name).
- Both `prisma` and `db` are exported from `src/lib/db.ts` (aliases for backwards compatibility).
- After schema changes: `npx prisma generate` then `npx prisma db push`.

### Commission Engine

`src/lib/commission-calculator.ts` is the core calculation engine. It applies `CommissionRule` records to a `CalculationContext`, supports PERCENTAGE, FLAT_AMOUNT, and TIERED rule types, and respects `RuleScope`/`RulePriority` (project-specific overrides customer-specific overrides global, etc.). Calculations produce a full audit trace stored in `CommissionCalculation.metadata`.

### Acumatica Integration

`src/lib/acumatica/` contains the REST API client and sync logic for importing invoices from Acumatica ERP. The integration is configured per-organization in `AcumaticaIntegration` and supports configurable field mappings, salesperson mappings, and sync schedules. Many fields in `AcumaticaIntegration` are marked `@deprecated` — prefer the `fieldMappings` and `filterConfig` JSON fields.

### Key Patterns

**Server Action pattern:**
```typescript
'use server'
export async function createFoo(data: CreateFooInput) {
  const user = await getCurrentUserWithOrg()  // auth + org check
  const validated = schema.parse(data)        // Zod validation
  const result = await db.foo.create({ data: { ...validated, organizationId: user.organizationId } })
  revalidatePath('/dashboard/foos')
  return { success: true, data: result }
}
```

**External API route pattern:**
```typescript
export const GET = withApiAuth(
  async (request, context) => {
    // context.organizationId is always the authenticated org
    const items = await db.foo.findMany({ where: { organizationId: context.organizationId } })
    return NextResponse.json({ data: items })
  },
  { requiredScope: 'foos:read' }
)
```

### Testing

- Unit tests (`tests/unit/`): Vitest with jsdom. Test the commission calculator and multi-tenancy logic.
- Integration tests (`tests/integration/`): Test server actions against a real database.
- E2E tests (`tests/e2e/`): Playwright against a running dev server.
- Coverage threshold: 80% lines/functions/branches/statements across `src/`.
- Vercel blocks deployment if unit tests fail (configured in `scripts/vercel-build.js`).
