'use client';

import { Mail, MessageSquare, Clock, ArrowRight, DollarSign, Menu, X, HelpCircle, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useState } from 'react';
import Link from 'next/link';

export default function ContactPage() {
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
            <Link href="/developers" className="text-sm hover:text-blue-600 transition-colors">Developers</Link>
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
            <Link href="/developers" className="block text-sm hover:text-blue-600">Developers</Link>
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
            <MessageSquare className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium">We're Here to Help</span>
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
            <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Contact Us
            </span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-3xl mx-auto leading-relaxed">
            Have questions, need support, or want to learn more about CommissionFlow? We'd love to hear from you.
          </p>
        </div>
      </section>

      {/* Contact Options */}
      <section className="py-12">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Support */}
            <Card className="border-2 hover:border-blue-500/30 transition-all hover:shadow-lg">
              <CardHeader>
                <div className="h-12 w-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center mb-4">
                  <HelpCircle className="h-6 w-6 text-white" />
                </div>
                <CardTitle>Technical Support</CardTitle>
                <CardDescription>
                  Need help with your account, integrations, or technical issues? Our support team is ready to assist.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>Response within 24 hours</span>
                </div>
                <a href="mailto:support@junova.io">
                  <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:opacity-90">
                    <Mail className="mr-2 h-4 w-4" />
                    support@junova.io
                  </Button>
                </a>
              </CardContent>
            </Card>

            {/* General Inquiries */}
            <Card className="border-2 hover:border-purple-500/30 transition-all hover:shadow-lg">
              <CardHeader>
                <div className="h-12 w-12 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg flex items-center justify-center mb-4">
                  <Mail className="h-6 w-6 text-white" />
                </div>
                <CardTitle>General Inquiries</CardTitle>
                <CardDescription>
                  Questions about pricing, partnerships, or just want to say hello? We'd love to connect.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>Response within 48 hours</span>
                </div>
                <a href="mailto:contact@junova.io">
                  <Button variant="outline" className="w-full border-2">
                    <Mail className="mr-2 h-4 w-4" />
                    contact@junova.io
                  </Button>
                </a>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* FAQ Link */}
      <section className="py-12 bg-muted/30">
        <div className="container mx-auto px-4 max-w-4xl">
          <Card className="border-2 border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 to-green-500/5">
            <CardHeader className="text-center">
              <div className="h-12 w-12 bg-gradient-to-br from-emerald-600 to-green-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <CardTitle>Looking for Quick Answers?</CardTitle>
              <CardDescription className="text-base">
                Check out our Help & Support page with FAQs, getting started guides, and step-by-step tutorials.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Link href="/dashboard/help">
                <Button variant="outline" size="lg" className="border-2">
                  Visit Help Center
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Additional Info */}
      <section className="py-12">
        <div className="container mx-auto px-4 max-w-4xl text-center">
          <h2 className="text-2xl font-bold mb-4">What to Include in Your Message</h2>
          <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
            To help us assist you faster, please include the following information when reaching out:
          </p>
          <div className="grid sm:grid-cols-3 gap-4 text-left max-w-3xl mx-auto">
            <div className="p-4 rounded-lg bg-muted/50 border">
              <p className="font-semibold mb-1">For Support</p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>Your account email</li>
                <li>Description of the issue</li>
                <li>Steps to reproduce</li>
                <li>Screenshots (if applicable)</li>
              </ul>
            </div>
            <div className="p-4 rounded-lg bg-muted/50 border">
              <p className="font-semibold mb-1">For Sales</p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>Company name</li>
                <li>Team size</li>
                <li>Current tools used</li>
                <li>Specific requirements</li>
              </ul>
            </div>
            <div className="p-4 rounded-lg bg-muted/50 border">
              <p className="font-semibold mb-1">For Partnerships</p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>Company information</li>
                <li>Partnership type</li>
                <li>Value proposition</li>
                <li>Contact details</li>
              </ul>
            </div>
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
              <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
              <Link href="/terms" className="hover:text-foreground transition-colors">Terms</Link>
              <a href="mailto:contact@junova.io" className="hover:text-foreground transition-colors">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
