// src/app/dashboard/settings/api-keys/layout.tsx
import { requireAdmin } from '@/lib/auth'

export default async function ApiKeysLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Require admin role to access API keys page
  await requireAdmin()

  return <>{children}</>
}
