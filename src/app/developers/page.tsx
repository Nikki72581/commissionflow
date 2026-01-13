'use client';

import { ArrowRight, Code, Key, Shield, Zap, DollarSign, Menu, X, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useState } from 'react';
import Link from 'next/link';

export default function DevelopersPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <div className="h-8 w-8 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 rounded-lg flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">CommissionFlow</span>
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
      <section className="relative py-16 md:py-24 overflow-hidden">
        {/* Background gradient blobs */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>

        <div className="container mx-auto px-4 text-center relative">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 mb-6">
            <Code className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium">REST API v1.0</span>
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
            <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              CommissionFlow
            </span>
            {' '}API Documentation
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-3xl mx-auto leading-relaxed">
            Build powerful integrations with our RESTful API. Manage sales transactions, clients, projects, and commissions programmatically.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/dashboard/settings/api-keys">
              <Button size="lg" className="px-8 bg-gradient-to-r from-blue-600 to-purple-600 hover:opacity-90">
                <Key className="mr-2 h-5 w-5" />
                Get API Key
              </Button>
            </Link>
            <a href="/api/v1/openapi.json" target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="lg" className="px-8 border-2">
                View OpenAPI Spec
                <ExternalLink className="ml-2 h-4 w-4" />
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* Quick Links Section */}
      <section className="border-b bg-muted/30 py-8">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            <a href="#authentication" className="flex items-center gap-2 p-3 rounded-lg hover:bg-background border border-transparent hover:border-border transition-all">
              <Shield className="h-5 w-5 text-blue-600" />
              <span className="text-sm font-medium">Authentication</span>
            </a>
            <a href="#rate-limits" className="flex items-center gap-2 p-3 rounded-lg hover:bg-background border border-transparent hover:border-border transition-all">
              <Zap className="h-5 w-5 text-purple-600" />
              <span className="text-sm font-medium">Rate Limits</span>
            </a>
            <a href="#endpoints" className="flex items-center gap-2 p-3 rounded-lg hover:bg-background border border-transparent hover:border-border transition-all">
              <Code className="h-5 w-5 text-pink-600" />
              <span className="text-sm font-medium">Endpoints</span>
            </a>
            <a href="#support" className="flex items-center gap-2 p-3 rounded-lg hover:bg-background border border-transparent hover:border-border transition-all">
              <ArrowRight className="h-5 w-5 text-blue-600" />
              <span className="text-sm font-medium">Support</span>
            </a>
          </div>
        </div>
      </section>

      {/* API Key Management Section */}
      <section className="py-12" id="authentication">
        <div className="container mx-auto px-4 max-w-4xl">
          <Card className="border-2 border-blue-500/20 bg-gradient-to-br from-blue-500/5 to-purple-500/5">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <Key className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle>Get Your API Key</CardTitle>
                  <CardDescription className="mt-1">
                    You'll need an API key to test the endpoints below
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ol className="list-decimal list-inside space-y-3 text-sm text-muted-foreground mb-6">
                <li>Sign in to your CommissionFlow account</li>
                <li>Navigate to <span className="font-medium text-foreground">Settings → API Keys</span></li>
                <li>Click <span className="font-medium text-foreground">"Create API Key"</span></li>
                <li>Select required scopes (e.g., <code className="px-1.5 py-0.5 bg-muted rounded text-xs font-mono">sales:read</code>, <code className="px-1.5 py-0.5 bg-muted rounded text-xs font-mono">sales:write</code>)</li>
                <li>Copy your key and use it in the "Try It" section below</li>
              </ol>
              <Link href="/dashboard/settings/api-keys">
                <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:opacity-90">
                  Go to API Keys <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                <p className="text-sm text-amber-900 dark:text-amber-200">
                  <strong>Security Note:</strong> Never share your API keys or commit them to version control. Use environment variables for production applications.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Rate Limits Info */}
      <section className="py-8 bg-muted/30" id="rate-limits">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="flex items-start gap-4">
            <div className="h-10 w-10 bg-purple-100 dark:bg-purple-950 rounded-lg flex items-center justify-center flex-shrink-0">
              <Zap className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">Rate Limits</h3>
              <p className="text-sm text-muted-foreground mb-3">
                API requests are limited to 1,000 requests per hour per API key. Rate limit information is included in response headers.
              </p>
              <div className="flex flex-wrap gap-2">
                <code className="px-2 py-1 bg-background rounded text-xs font-mono border">X-RateLimit-Limit: 1000</code>
                <code className="px-2 py-1 bg-background rounded text-xs font-mono border">X-RateLimit-Remaining: 999</code>
                <code className="px-2 py-1 bg-background rounded text-xs font-mono border">X-RateLimit-Reset: 2024-01-15T12:00:00Z</code>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* API Reference Section */}
      <section className="py-12" id="endpoints">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="mb-8 text-center">
            <h2 className="text-3xl font-bold mb-3">API Reference</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto mb-6">
              Explore all available endpoints. Click "Try It" to test API calls directly from your browser.
            </p>
          </div>

          <Card className="border-2">
            <CardContent className="pt-6">
              <div className="text-center space-y-6">
                <div className="h-16 w-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto">
                  <Code className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Interactive API Documentation</h3>
                  <p className="text-muted-foreground text-sm mb-6">
                    View the full API reference with interactive examples and the ability to test endpoints in real-time.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link href="/api/reference">
                    <Button size="lg" className="px-8 bg-gradient-to-r from-blue-600 to-purple-600 hover:opacity-90">
                      <Code className="mr-2 h-5 w-5" />
                      View API Reference
                    </Button>
                  </Link>
                  <a href="/api/v1/openapi.json" target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="lg" className="px-8 border-2">
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
      <section className="py-12 bg-muted/30" id="support">
        <div className="container mx-auto px-4 max-w-4xl text-center">
          <h2 className="text-2xl font-bold mb-3">Need Help?</h2>
          <p className="text-muted-foreground mb-6">
            Our team is here to help you integrate successfully.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="mailto:support@commissionflow.com">
              <Button variant="outline" size="lg" className="px-8 border-2">
                Contact Support
              </Button>
            </a>
            <a href="https://github.com/commissionflow/api-examples" target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="lg" className="px-8 border-2">
                View Examples on GitHub
                <ExternalLink className="ml-2 h-4 w-4" />
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12 mt-auto">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 rounded-lg flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-white" />
              </div>
              <span className="font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">CommissionFlow</span>
            </div>
            <p className="text-sm text-muted-foreground">© 2024 CommissionFlow. All rights reserved.</p>
            <div className="flex gap-6 text-sm text-muted-foreground">
              <a href="/privacy" className="hover:text-foreground transition-colors">Privacy</a>
              <a href="/terms" className="hover:text-foreground transition-colors">Terms</a>
              <a href="mailto:contact@commissionflow.com" className="hover:text-foreground transition-colors">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
