'use client';

import { ArrowRight, Code, Key, Shield, Zap, DollarSign, Menu, X, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useState } from 'react';
import Link from 'next/link';

export default function DevelopersPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex flex-col min-h-screen noise-overlay relative">
      {/* Header */}
      <header className="border-b border-border/50 glass sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-3">
            <div className="h-9 w-9 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/25 animate-gradient">
              <DollarSign className="h-5 w-5 text-white" />
            </div>
            <span className="font-display font-bold text-lg text-gradient">CommissionFlow</span>
          </Link>
          <nav className="hidden md:flex items-center space-x-6">
            <Link href="/#features" className="text-sm hover:text-blue-600 transition-colors">Features</Link>
            <Link href="/#pricing" className="text-sm hover:text-blue-600 transition-colors">Pricing</Link>
            <Link href="/developers" className="text-sm text-blue-600 font-medium transition-colors">Developers</Link>
            <Link href="/sign-in" className="text-sm hover:text-blue-600 transition-colors">Sign In</Link>
            <Link href="/sign-in">
              <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:opacity-90">
                Get Started <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </nav>
          <button className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t bg-background p-4 space-y-4">
            <Link href="/#features" className="block text-sm hover:text-blue-600">Features</Link>
            <Link href="/#pricing" className="block text-sm hover:text-blue-600">Pricing</Link>
            <Link href="/developers" className="block text-sm text-blue-600 font-medium">Developers</Link>
            <Link href="/sign-in" className="block text-sm hover:text-blue-600">Sign In</Link>
            <Link href="/sign-in" className="block w-full">
              <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600">Get Started</Button>
            </Link>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="relative py-20 md:py-32 overflow-hidden">
        {/* Enhanced background with gradient mesh */}
        <div className="absolute inset-0 -z-10 gradient-mesh opacity-40"></div>

        {/* Floating gradient orbs */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute top-20 left-[15%] w-[500px] h-[500px] bg-blue-500/30 rounded-full blur-[120px] animate-float"></div>
          <div className="absolute bottom-20 right-[15%] w-[400px] h-[400px] bg-purple-500/25 rounded-full blur-[100px] animate-float" style={{ animationDelay: '-3s' }}></div>
        </div>

        <div className="container mx-auto px-4 text-center relative z-10">
          {/* Badge with entrance animation */}
          <div className="animate-fade-up inline-flex items-center gap-2 px-5 py-2.5 rounded-full glass border border-blue-500/30 mb-10 shadow-lg shadow-blue-500/10">
            <Code className="h-4 w-4 text-blue-500" />
            <span className="text-sm font-medium">REST API v1.0</span>
          </div>

          {/* Headline with staggered animation */}
          <h1 className="animate-fade-up delay-100 font-display text-5xl md:text-6xl lg:text-7xl font-black tracking-tight mb-8 leading-[0.95]">
            <span className="text-gradient">
              CommissionFlow
            </span>
            {' '}API
          </h1>

          {/* Subheadline */}
          <p className="animate-fade-up delay-200 text-lg md:text-xl text-muted-foreground mb-12 max-w-3xl mx-auto leading-relaxed">
            Build powerful integrations with our RESTful API. Manage sales transactions, clients, projects, and commissions programmatically.
          </p>

          {/* CTA buttons */}
          <div className="animate-fade-up delay-300 flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/dashboard/settings/api-keys">
              <Button size="lg" className="px-10 h-14 text-base bg-gradient-to-r from-blue-600 to-purple-600 hover:opacity-90 shadow-xl shadow-purple-500/25 transition-all hover:shadow-2xl hover:shadow-purple-500/30 hover:-translate-y-0.5">
                <Key className="mr-2 h-5 w-5" />
                Get API Key
              </Button>
            </Link>
            <a href="/api/v1/openapi.json" target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="lg" className="px-10 h-14 text-base border-2 hover:bg-primary/5 transition-all hover:-translate-y-0.5">
                View OpenAPI Spec
                <ExternalLink className="ml-2 h-4 w-4" />
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* Quick Links Section */}
      <section className="border-y border-border/50 bg-muted/20 py-10">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            <a href="#authentication" className="group flex items-center gap-3 p-4 rounded-xl glass border border-transparent hover:border-blue-500/30 transition-all duration-300 hover:-translate-y-1">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform">
                <Shield className="h-5 w-5 text-white" />
              </div>
              <span className="text-sm font-semibold">Authentication</span>
            </a>
            <a href="#rate-limits" className="group flex items-center gap-3 p-4 rounded-xl glass border border-transparent hover:border-purple-500/30 transition-all duration-300 hover:-translate-y-1">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/20 group-hover:scale-110 transition-transform">
                <Zap className="h-5 w-5 text-white" />
              </div>
              <span className="text-sm font-semibold">Rate Limits</span>
            </a>
            <a href="#endpoints" className="group flex items-center gap-3 p-4 rounded-xl glass border border-transparent hover:border-pink-500/30 transition-all duration-300 hover:-translate-y-1">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-pink-500 to-pink-600 flex items-center justify-center shadow-lg shadow-pink-500/20 group-hover:scale-110 transition-transform">
                <Code className="h-5 w-5 text-white" />
              </div>
              <span className="text-sm font-semibold">Endpoints</span>
            </a>
            <a href="#support" className="group flex items-center gap-3 p-4 rounded-xl glass border border-transparent hover:border-cyan-500/30 transition-all duration-300 hover:-translate-y-1">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 group-hover:scale-110 transition-transform">
                <ArrowRight className="h-5 w-5 text-white" />
              </div>
              <span className="text-sm font-semibold">Support</span>
            </a>
          </div>
        </div>
      </section>

      {/* API Key Management Section */}
      <section className="py-16" id="authentication">
        <div className="container mx-auto px-4 max-w-4xl">
          <Card className="border-0 shadow-2xl shadow-blue-500/10 bg-gradient-to-br from-card via-card to-blue-500/5 overflow-hidden relative">
            {/* Decorative gradient */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>

            <CardHeader className="relative">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                  <Key className="h-7 w-7 text-white" />
                </div>
                <div>
                  <CardTitle className="font-display text-2xl font-bold">Get Your API Key</CardTitle>
                  <CardDescription className="mt-1 text-base">
                    You&apos;ll need an API key to test the endpoints below
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="relative">
              <ol className="list-decimal list-inside space-y-4 text-sm text-muted-foreground mb-8">
                <li className="leading-relaxed">Sign in to your CommissionFlow account</li>
                <li className="leading-relaxed">Navigate to <span className="font-semibold text-foreground">Settings → API Keys</span></li>
                <li className="leading-relaxed">Click <span className="font-semibold text-foreground">&quot;Create API Key&quot;</span></li>
                <li className="leading-relaxed">Select required scopes (e.g., <code className="px-2 py-1 bg-muted/80 rounded-md text-xs font-mono border">sales:read</code>, <code className="px-2 py-1 bg-muted/80 rounded-md text-xs font-mono border">sales:write</code>)</li>
                <li className="leading-relaxed">Copy your key and use it in the &quot;Try It&quot; section below</li>
              </ol>
              <Link href="/dashboard/settings/api-keys">
                <Button className="h-12 px-8 bg-gradient-to-r from-blue-600 to-purple-600 hover:opacity-90 shadow-lg shadow-purple-500/25 transition-all hover:shadow-xl hover:shadow-purple-500/30 hover:-translate-y-0.5">
                  Go to API Keys <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <div className="mt-8 p-5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200/50 dark:border-amber-800/50 rounded-xl">
                <p className="text-sm text-amber-900 dark:text-amber-200 leading-relaxed">
                  <strong className="font-semibold">Security Note:</strong> Never share your API keys or commit them to version control. Use environment variables for production applications.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Rate Limits Info */}
      <section className="py-12 bg-muted/20 border-y border-border/50" id="rate-limits">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="flex items-start gap-5">
            <div className="h-12 w-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-purple-500/20">
              <Zap className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="font-display text-xl font-bold mb-3">Rate Limits</h3>
              <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                API requests are limited to 1,000 requests per hour per API key. Rate limit information is included in response headers.
              </p>
              <div className="flex flex-wrap gap-3">
                <code className="px-3 py-1.5 bg-card rounded-lg text-xs font-mono border shadow-sm">X-RateLimit-Limit: 1000</code>
                <code className="px-3 py-1.5 bg-card rounded-lg text-xs font-mono border shadow-sm">X-RateLimit-Remaining: 999</code>
                <code className="px-3 py-1.5 bg-card rounded-lg text-xs font-mono border shadow-sm">X-RateLimit-Reset: 2024-01-15T12:00:00Z</code>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* API Reference Section */}
      <section className="py-16" id="endpoints">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="mb-12 text-center">
            <h2 className="font-display text-4xl font-black mb-4 tracking-tight">API Reference</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
              Explore all available endpoints. Click &quot;Try It&quot; to test API calls directly from your browser.
            </p>
          </div>

          <Card className="border-0 shadow-2xl shadow-purple-500/10 overflow-hidden relative">
            {/* Decorative background */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5"></div>

            <CardContent className="pt-10 pb-10 relative">
              <div className="text-center space-y-8">
                <div className="h-20 w-20 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 rounded-3xl flex items-center justify-center mx-auto shadow-2xl shadow-purple-500/30 animate-gradient">
                  <Code className="h-10 w-10 text-white" />
                </div>
                <div>
                  <h3 className="font-display text-2xl font-bold mb-3">Interactive API Documentation</h3>
                  <p className="text-muted-foreground mb-8 max-w-lg mx-auto leading-relaxed">
                    View the full API reference with interactive examples and the ability to test endpoints in real-time.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link href="/api/reference">
                    <Button size="lg" className="px-10 h-14 text-base bg-gradient-to-r from-blue-600 to-purple-600 hover:opacity-90 shadow-xl shadow-purple-500/25 transition-all hover:shadow-2xl hover:shadow-purple-500/30 hover:-translate-y-0.5">
                      <Code className="mr-2 h-5 w-5" />
                      View API Reference
                    </Button>
                  </Link>
                  <a href="/api/v1/openapi.json" target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="lg" className="px-10 h-14 text-base border-2 hover:bg-primary/5 transition-all hover:-translate-y-0.5">
                      Download OpenAPI Spec
                      <ExternalLink className="ml-2 h-4 w-4" />
                    </Button>
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Support Section */}
      <section className="py-20 bg-muted/20 border-t border-border/50" id="support">
        <div className="container mx-auto px-4 max-w-4xl text-center">
          <h2 className="font-display text-3xl font-black mb-4 tracking-tight">Need Help?</h2>
          <p className="text-muted-foreground mb-8 text-lg">
            Our team is here to help you integrate successfully.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="mailto:support@junova.io">
              <Button variant="outline" size="lg" className="px-10 h-14 text-base border-2 hover:bg-primary/5 transition-all hover:-translate-y-0.5">
                Contact Support
              </Button>
            </a>
            <a href="https://github.com/commissionflow/api-examples" target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="lg" className="px-10 h-14 text-base border-2 hover:bg-primary/5 transition-all hover:-translate-y-0.5">
                View Examples on GitHub
                <ExternalLink className="ml-2 h-4 w-4" />
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-16 bg-muted/10">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/20">
                <DollarSign className="h-5 w-5 text-white" />
              </div>
              <span className="font-display font-bold text-lg text-gradient">CommissionFlow</span>
            </div>
            <p className="text-sm text-muted-foreground">&copy; 2025 CommissionFlow. All rights reserved.</p>
            <div className="flex gap-8 text-sm">
              <a href="/privacy" className="text-muted-foreground hover:text-foreground transition-colors">Privacy</a>
              <a href="/terms" className="text-muted-foreground hover:text-foreground transition-colors">Terms</a>
              <a href="mailto:contact@junova.io" className="text-muted-foreground hover:text-foreground transition-colors">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
