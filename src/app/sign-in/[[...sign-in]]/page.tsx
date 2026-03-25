// app/sign-in/[[...sign-in]]/page.tsx
import { SignIn } from '@clerk/nextjs';
import { DollarSign, Play } from 'lucide-react';
import Link from 'next/link';

export default function SignInPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background gradient blobs */}
      <div className="absolute inset-0 -z-10 bg-background">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      {/* Logo */}
      <Link href="/" className="flex items-center space-x-2 mb-8">
        <div className="h-10 w-10 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 rounded-lg flex items-center justify-center">
          <DollarSign className="h-6 w-6 text-white" />
        </div>
        <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">CommissionFlow</span>
      </Link>

      <SignIn />

      {/* Demo CTA */}
      <div className="mt-6 flex flex-col items-center gap-3">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <span className="h-px w-16 bg-border" />
          <span>or</span>
          <span className="h-px w-16 bg-border" />
        </div>
        <Link
          href="/api/demo-login"
          className="flex items-center gap-2 rounded-lg border border-border bg-background/80 px-5 py-2.5 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          <Play className="h-4 w-4 text-blue-500" />
          View Demo — no sign-up required
        </Link>
        <p className="text-xs text-muted-foreground">
          Explore with pre-loaded sample data. Changes are visible to everyone.
        </p>
      </div>
    </div>
  );
}