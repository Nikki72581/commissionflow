# CommissionFlow

A modern, full-stack commission management platform built with Next.js. Track sales, manage commission plans, calculate payouts, and streamline your sales team operations.

## Features

### Core Functionality
- **Client & Project Management** - Organize clients and projects with full CRUD operations
- **Commission Plan Builder** - Create flexible commission structures with multiple rule types
  - Percentage-based commissions
  - Flat amount commissions
  - Tiered/accelerator commissions with thresholds
  - Min/max caps on payouts
- **Sales Tracking** - Record sales transactions and link them to projects
- **Automatic Calculations** - Apply commission plans to sales automatically
- **Salesperson Portal** - Self-service dashboard for sales team members
- **Bulk Payouts** - Process multiple commission payments at once
- **Email Notifications** - Automated notifications for approvals and payments
- **Audit Logs** - Comprehensive activity tracking for compliance
- **Reporting & Analytics** - Dashboards, charts, and export capabilities

### Technical Features
- Multi-tenant organization support with Clerk authentication
- Type-safe server actions with Zod validation
- Real-time data updates with automatic revalidation
- Responsive UI built with Tailwind CSS and shadcn/ui
- PostgreSQL database with Prisma ORM
- CSV import/export functionality
- Comprehensive test coverage (unit, integration, E2E)

## Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org) (App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Database**: PostgreSQL with [Prisma ORM](https://www.prisma.io/)
- **Authentication**: [Clerk](https://clerk.com/)
- **UI Components**: [shadcn/ui](https://ui.shadcn.com/) + [Radix UI](https://www.radix-ui.com/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Forms**: [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/)
- **Charts**: [Recharts](https://recharts.org/)
- **Email**: [Resend](https://resend.com/)
- **Testing**: [Vitest](https://vitest.dev/) + [Playwright](https://playwright.dev/)

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn/pnpm
- PostgreSQL database
- Clerk account for authentication
- Resend account for email notifications (optional)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd commissionflow
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

Required environment variables:
```env
# Database
DATABASE_URL="postgresql://..."

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_..."
CLERK_SECRET_KEY="sk_..."
NEXT_PUBLIC_CLERK_SIGN_IN_URL="/sign-in"
NEXT_PUBLIC_CLERK_SIGN_UP_URL="/sign-up"

# Resend (for email notifications)
RESEND_API_KEY="re_..."
RESEND_FROM_EMAIL="noreply@yourdomain.com"

# Application
COMPANY_NAME="Your Company Name"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

4. Set up the database:
```bash
npx prisma generate
npx prisma db push
```

5. Seed demo data (optional):
```bash
npm run db:seed
```

6. Start the development server:
```bash
npm run dev
```

7. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
src/
├── app/
│   ├── actions/            # Server Actions (data mutations)
│   ├── api/
│   │   ├── v1/             # External REST API (API-key auth)
│   │   ├── acumatica/      # Acumatica webhook/sync endpoints
│   │   ├── webhooks/       # Clerk webhooks
│   │   └── dashboard/      # Internal API routes
│   └── dashboard/          # Authenticated pages (admin + salesperson)
├── components/             # React components organized by feature
├── hooks/                  # Custom React hooks
├── lib/
│   ├── acumatica/          # Acumatica API client + sync logic
│   ├── validations/        # Zod schemas
│   ├── commission-calculator.ts  # Core calculation engine
│   └── ...                 # Auth, db, email, audit-log, etc.
├── types/                  # TypeScript type definitions
prisma/
├── schema.prisma           # Database schema
└── seed.ts                 # Seed script
tests/
├── unit/                   # Unit tests (Vitest)
├── integration/            # Integration tests
└── e2e/                    # E2E tests (Playwright)
```

## Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm start            # Start production server
npm run lint         # Run ESLint
npm run db:seed      # Seed database with demo data

# Testing
npm run test:all         # Run all tests
npm run test:unit        # Run unit tests only
npm run test:integration # Run integration tests
npm run test:e2e         # Run E2E tests
npm run test:coverage    # Generate coverage report
```

## Documentation

### Developer Reference
- [CLAUDE.md](CLAUDE.md) - Architecture, patterns, and commands (primary dev reference)
- [TESTING.md](TESTING.md) - Testing guide (unit, integration, E2E)
- [TEST-IDS-GUIDE.md](TEST-IDS-GUIDE.md) - data-testid conventions for E2E tests
- [BRAND-STYLE-GUIDE.md](BRAND-STYLE-GUIDE.md) - UI design tokens and patterns

### Integration & Setup
- [ACUMATICA_SETUP.md](ACUMATICA_SETUP.md) - Acumatica ERP integration setup and troubleshooting
- [CommissionFlow-Acumatica-Integration-ProductSpec-v2.md](CommissionFlow-Acumatica-Integration-ProductSpec-v2.md) - Acumatica integration product spec
- [TEAM_INVITATIONS_SETUP.md](TEAM_INVITATIONS_SETUP.md) - Clerk Organizations team invitation setup

### API Reference
- [docs/api/getting-started.md](docs/api/getting-started.md) - External API authentication, scopes, and rate limits
- [docs/api/](docs/api/) - Full REST API documentation by resource

## Key Features

### Multi-Rule Commission Plans
Stack multiple commission rules to create complex compensation structures:
- Base percentage commission (e.g., 5% of all sales)
- Bonus for large deals (e.g., $1,000 for sales over $50k)
- Accelerator for high performers (e.g., additional 2% above $100k)

### Organization Multi-Tenancy
All data is automatically scoped to organizations:
- Secure data isolation between organizations
- Users can belong to multiple organizations
- Automatic filtering in all queries

### Type-Safe Server Actions
All data operations use Next.js Server Actions with full type safety:
```typescript
const result = await createCommissionPlan({
  name: "Standard Sales",
  isActive: true
})

if (result.success) {
  console.log(result.data) // Fully typed
}
```

### Workflow Automation
- Commissions automatically calculated when sales are recorded
- Email notifications sent on approval and payment
- Bulk payout processing for efficiency
- Complete audit trail for compliance

## Troubleshooting

### Database Connection Issues
- Verify `DATABASE_URL` is correctly set in `.env.local`
- Ensure PostgreSQL is running
- Run `npx prisma db push` to sync schema

### Authentication Issues
- Check Clerk API keys are correct
- Verify user has been assigned to an organization
- Clear cookies and sign in again

### Missing UI Components
Install required shadcn/ui components:
```bash
npx shadcn-ui@latest add button card input label table badge dialog
```

### Testing Issues
See [TESTING.md](TESTING.md) for detailed testing setup and troubleshooting.

## Contributing

This is a private project. Please contact the repository owner for contribution guidelines.

## License

Proprietary - All rights reserved.

## Support

For questions or issues, please contact the development team or create an issue in the repository.
