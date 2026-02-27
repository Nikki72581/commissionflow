# Documentation Agent Memory

## Documentation Structure (Post-Consolidation Feb 2027)

Root-level docs were consolidated from 25+ files to 8. The `docs/api/` directory (9 files) contains external API reference docs and is kept intact.

### Root-Level Documentation Files
- `README.md` - Project overview, setup, and documentation index
- `CLAUDE.md` - Primary developer reference (authoritative for architecture, commands, patterns)
- `TESTING.md` - Comprehensive testing guide (unit, integration, E2E)
- `TEST-IDS-GUIDE.md` - data-testid naming conventions for Playwright E2E tests
- `BRAND-STYLE-GUIDE.md` - UI design tokens, color system, component patterns
- `ACUMATICA_SETUP.md` - Acumatica ERP integration setup + deployment + troubleshooting
- `TEAM_INVITATIONS_SETUP.md` - Clerk Organizations team invitation setup
- `CommissionFlow-Acumatica-Integration-ProductSpec-v2.md` - Product spec for discovery-driven Acumatica integration

### In-Directory Documentation
- `src/lib/acumatica/README.md` - Version compatibility notes for Acumatica client
- `docs/api/*.md` - External REST API reference (getting-started, errors, and per-resource docs)

## Key Decisions
- STEP-2 through STEP-6 files were deleted as obsolete build guides
- TESTING-SUMMARY.md was a duplicate of TESTING.md
- USER_TESTING_CHECKLIST.md and USER_TESTING_GUIDE.md were manual QA docs, not developer docs
- DEPLOYMENT_CHECKLIST.md, VERCEL_DEPLOYMENT.md, TROUBLESHOOTING.md were all Acumatica-specific and merged into ACUMATICA_SETUP.md
- RESEND-SETUP.md and INTEGRATION-GUIDE.md (email notification) were brief and redundant with inline code
- FILE-STRUCTURE.md was frozen at "After Step 2" and completely outdated
- DEVELOPMENT_WORKFLOW.md was covered by CLAUDE.md
