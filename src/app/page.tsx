'use client';

import { CheckCircle, Zap, Shield, TrendingUp, Users, DollarSign, ArrowRight, Sparkles, BarChart3, Lock, Menu, X, Plug, Key } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

// Animated counter hook for stats
function useCountUp(end: number, duration: number = 2000, startOnView: boolean = true) {
  const [count, setCount] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!startOnView) {
      setHasStarted(true);
    }
  }, [startOnView]);

  useEffect(() => {
    if (startOnView && ref.current) {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting && !hasStarted) {
            setHasStarted(true);
          }
        },
        { threshold: 0.5 }
      );
      observer.observe(ref.current);
      return () => observer.disconnect();
    }
  }, [startOnView, hasStarted]);

  useEffect(() => {
    if (!hasStarted) return;

    let startTime: number;
    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      setCount(Math.floor(easeOutQuart * end));
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    requestAnimationFrame(animate);
  }, [hasStarted, end, duration]);

  return { count, ref };
}

// Animated stat component
function AnimatedStat({ value, suffix, label }: { value: number; suffix: string; label: string }) {
  const { count, ref } = useCountUp(value, 2000);
  return (
    <div ref={ref} className="text-center">
      <div className="text-3xl md:text-5xl font-display font-black text-gradient">
        {count}{suffix}
      </div>
      <div className="text-sm text-muted-foreground mt-2 font-medium tracking-wide uppercase">
        {label}
      </div>
    </div>
  );
}

export default function App() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex flex-col min-h-screen noise-overlay relative">
      <div className="w-full bg-amber-50 border-b border-amber-200">
        <div className="container mx-auto px-4 py-2 text-sm text-amber-900 flex items-center gap-2">
          <Shield className="h-4 w-4 text-amber-700" />
          <span>
            Early development preview. Free to try and open to the public, but use at your own risk. Pre-production updates may cause data loss.
          </span>
        </div>
      </div>
      {/* Header */}
      <header className="border-b border-border/50 glass sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-9 w-9 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/25 animate-gradient">
              <DollarSign className="h-5 w-5 text-white" />
            </div>
            <span className="font-display font-bold text-lg text-gradient">CommissionFlow</span>
          </div>
          <nav className="hidden md:flex items-center space-x-6">
            <a href="#features" className="text-sm hover:text-blue-600 transition-colors">Features</a>
            <a href="#pricing" className="text-sm hover:text-blue-600 transition-colors">Pricing</a>
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
            <a href="#features" className="block text-sm hover:text-blue-600">Features</a>
            <a href="#pricing" className="block text-sm hover:text-blue-600">Pricing</a>
            <Link href="/developers" className="block text-sm hover:text-blue-600">Developers</Link>
            <Link href="/sign-in" className="block text-sm hover:text-blue-600">Sign In</Link>
            <Link href="/sign-in" className="block w-full">
              <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600">Get Started</Button>
            </Link>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="relative py-24 md:py-40 overflow-hidden">
        {/* Enhanced background with gradient mesh */}
        <div className="absolute inset-0 -z-10 gradient-mesh opacity-40"></div>

        {/* Floating gradient orbs */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute top-20 left-[15%] w-[500px] h-[500px] bg-blue-500/30 rounded-full blur-[120px] animate-float"></div>
          <div className="absolute bottom-20 right-[15%] w-[400px] h-[400px] bg-purple-500/25 rounded-full blur-[100px] animate-float" style={{ animationDelay: '-3s' }}></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-pink-500/15 rounded-full blur-[140px] animate-float" style={{ animationDelay: '-1.5s' }}></div>
        </div>

        <div className="container mx-auto px-4 text-center relative z-10">
          {/* Badge with entrance animation */}
          <div className="animate-fade-up inline-flex items-center gap-2 px-5 py-2.5 rounded-full glass border border-blue-500/30 mb-10 shadow-lg shadow-blue-500/10">
            <Sparkles className="h-4 w-4 text-blue-500" />
            <span className="text-sm font-medium">AI-Powered Commission Intelligence</span>
          </div>

          {/* Headline with staggered animation */}
          <h1 className="animate-fade-up delay-100 font-display text-5xl md:text-7xl lg:text-8xl font-black tracking-tight mb-8 leading-[0.95]">
            Sales Commission
            <br />
            Management,{' '}
            <span className="text-gradient animate-gradient inline-block">
              Reimagined
            </span>
          </h1>

          {/* Subheadline */}
          <p className="animate-fade-up delay-200 text-lg md:text-xl text-muted-foreground mb-12 max-w-3xl mx-auto leading-relaxed">
            Ditch the spreadsheets. Harness AI to design, calculate, and manage sales commissions with complete confidence and transparency.
          </p>

          {/* CTA buttons */}
          <div className="animate-fade-up delay-300 flex flex-col sm:flex-row gap-4 justify-center mb-6">
            <Link href="/sign-in">
              <Button size="lg" className="px-10 h-14 text-base bg-gradient-to-r from-blue-600 to-purple-600 hover:opacity-90 shadow-xl shadow-purple-500/25 transition-all hover:shadow-2xl hover:shadow-purple-500/30 hover:-translate-y-0.5">
                Start Free Trial <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <a href="#features">
              <Button variant="outline" size="lg" className="px-10 h-14 text-base border-2 hover:bg-primary/5 transition-all hover:-translate-y-0.5">
                Learn More
              </Button>
            </a>
          </div>

          <p className="animate-fade-up delay-400 text-sm text-muted-foreground">No credit card required • 14-day free trial • Setup in minutes</p>

          {/* Animated Stats bar */}
          <div className="animate-fade-up delay-500 mt-20 grid grid-cols-3 gap-8 max-w-3xl mx-auto p-8 rounded-2xl glass border border-border/50">
            <AnimatedStat value={99} suffix="%" label="Accuracy Rate" />
            <div className="border-l border-border/50"></div>
            <AnimatedStat value={10} suffix="hrs" label="Saved Monthly" />
            <div className="col-span-3 border-t border-border/50 -mx-8 my-0"></div>
            <div className="col-span-3">
              <AnimatedStat value={5} suffix="min" label="Setup Time" />
            </div>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-muted/30 via-muted/50 to-background -z-10"></div>
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="font-display text-4xl md:text-6xl font-black mb-5 tracking-tight">The Commission Nightmare</h2>
              <p className="text-xl text-muted-foreground">Sound familiar? You&apos;re not alone.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-card/80 to-card shadow-xl shadow-black/5 hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-500 hover:-translate-y-2">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <CardHeader className="relative">
                  <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mb-4 shadow-lg shadow-blue-500/30 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
                    <BarChart3 className="h-7 w-7 text-white" />
                  </div>
                  <CardTitle className="font-display text-xl font-bold">Spreadsheet Hell</CardTitle>
                </CardHeader>
                <CardContent className="relative">
                  <p className="text-muted-foreground leading-relaxed">
                    Manually tracking sales and calculating commissions in Excel is error-prone, time-consuming, and completely unsustainable as you scale.
                  </p>
                </CardContent>
              </Card>

              <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-card/80 to-card shadow-xl shadow-black/5 hover:shadow-2xl hover:shadow-purple-500/10 transition-all duration-500 hover:-translate-y-2">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <CardHeader className="relative">
                  <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center mb-4 shadow-lg shadow-purple-500/30 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
                    <Users className="h-7 w-7 text-white" />
                  </div>
                  <CardTitle className="font-display text-xl font-bold">Zero Transparency</CardTitle>
                </CardHeader>
                <CardContent className="relative">
                  <p className="text-muted-foreground leading-relaxed">
                    Salespeople can&apos;t see their earnings in real-time, leading to constant questions, frustration, disputes, and missed motivation.
                  </p>
                </CardContent>
              </Card>

              <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-card/80 to-card shadow-xl shadow-black/5 hover:shadow-2xl hover:shadow-pink-500/10 transition-all duration-500 hover:-translate-y-2">
                <div className="absolute inset-0 bg-gradient-to-br from-pink-500/5 to-orange-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <CardHeader className="relative">
                  <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-pink-500 to-pink-600 flex items-center justify-center mb-4 shadow-lg shadow-pink-500/30 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
                    <TrendingUp className="h-7 w-7 text-white" />
                  </div>
                  <CardTitle className="font-display text-xl font-bold">Complex Plans</CardTitle>
                </CardHeader>
                <CardContent className="relative">
                  <p className="text-muted-foreground leading-relaxed">
                    Designing fair commission structures that motivate your team without breaking your budget is incredibly difficult and risky.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-28 relative overflow-hidden">
        {/* Subtle background */}
        <div className="absolute inset-0 -z-10 gradient-mesh opacity-20"></div>
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute top-1/3 left-0 w-[400px] h-[400px] bg-purple-500/20 rounded-full blur-[100px] animate-float" style={{ animationDelay: '-2s' }}></div>
          <div className="absolute top-1/4 right-0 w-[500px] h-[500px] bg-blue-500/15 rounded-full blur-[120px] animate-float"></div>
        </div>

        <div className="container mx-auto px-4">
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full glass border border-purple-500/30 mb-6 shadow-lg shadow-purple-500/10">
              <Zap className="h-4 w-4 text-purple-500" />
              <span className="text-sm font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wider">Powerful Features</span>
            </div>
            <h2 className="font-display text-4xl md:text-6xl font-black mb-6 tracking-tight">Everything You Need,<br />Nothing You Don&apos;t</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Built for modern sales teams who demand accuracy, transparency, and speed
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
            <FeatureCard
              icon={<Zap className="h-7 w-7" />}
              title="AI-Powered Plan Builder"
              description="Let AI help you design optimal commission structures or analyze existing plans for potential issues and hidden costs."
              gradient="from-blue-600 to-purple-600"
            />
            <FeatureCard
              icon={<TrendingUp className="h-7 w-7" />}
              title="Automated Calculations"
              description="Import sales data from any source and let CommissionFlow automatically calculate commissions based on your custom rules."
              gradient="from-blue-600 to-purple-600"
            />
            <FeatureCard
              icon={<Users className="h-7 w-7" />}
              title="Salesperson Portal"
              description="Give your team real-time visibility into their earnings with beautiful dashboards, detailed breakdowns, and progress tracking."
              gradient="from-blue-600 to-purple-600"
            />
            <FeatureCard
              icon={<Shield className="h-7 w-7" />}
              title="Secure & Compliant"
              description="Enterprise-grade security with role-based access control, data encryption, and complete audit trails for all transactions."
              gradient="from-blue-600 to-purple-600"
            />
            <FeatureCard
              icon={<Lock className="h-7 w-7" />}
              title="Seamless Integrations"
              description="Connect with your existing CRM, ERP, payment platforms, and HR systems for completely seamless data flow."
              gradient="from-blue-600 to-purple-600"
            />
            <FeatureCard
              icon={<DollarSign className="h-7 w-7" />}
              title="Payout Management"
              description="Track, approve, and process commission payouts all in one place with complete transparency and automated workflows."
              gradient="from-blue-600 to-purple-600"
            />
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-28 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-muted/30 to-background -z-10"></div>

        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full glass border border-blue-500/30 mb-6 shadow-lg shadow-blue-500/10">
              <DollarSign className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Pricing</span>
            </div>
            <h2 className="font-display text-4xl md:text-6xl font-black mb-6 tracking-tight">Simple, Transparent Pricing</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Start free and upgrade when you&apos;re ready to unlock powerful team features
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Free Plan */}
            <Card className="relative overflow-hidden border-2 border-border bg-card/50 backdrop-blur-sm shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2">
              <CardHeader className="pb-4">
                <CardTitle className="font-display text-2xl font-bold">Free</CardTitle>
                <CardDescription className="text-base">For individuals getting started</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-baseline gap-1">
                  <span className="text-5xl font-black">$0</span>
                  <span className="text-muted-foreground">/month</span>
                </div>

                <ul className="space-y-3">
                  <li className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0" />
                    <span>Unlimited salespeople</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0" />
                    <span>Commission plan builder</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0" />
                    <span>CSV data import</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0" />
                    <span>Basic reporting</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0" />
                    <span>Email support</span>
                  </li>
                </ul>

                <Link href="/sign-in" className="block">
                  <Button variant="outline" className="w-full h-12 text-base border-2">
                    Get Started Free
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Team Plan */}
            <Card className="relative overflow-hidden border-2 border-purple-500/50 bg-gradient-to-br from-purple-500/5 to-blue-500/5 shadow-xl shadow-purple-500/10 hover:shadow-2xl hover:shadow-purple-500/20 transition-all duration-500 hover:-translate-y-2">
              <div className="absolute top-4 right-4">
                <span className="px-3 py-1 text-xs font-semibold bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-full">
                  Most Popular
                </span>
              </div>
              <CardHeader className="pb-4">
                <CardTitle className="font-display text-2xl font-bold">Team</CardTitle>
                <CardDescription className="text-base">For growing teams that need more power</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-baseline gap-1">
                  <span className="text-5xl font-black">$49</span>
                  <span className="text-muted-foreground">/month</span>
                </div>

                <ul className="space-y-3">
                  <li className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-purple-500 shrink-0" />
                    <span className="font-medium">Everything in Free, plus:</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Users className="h-5 w-5 text-purple-500 shrink-0" />
                    <span>Team invitations & collaboration</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Plug className="h-5 w-5 text-purple-500 shrink-0" />
                    <span>ERP integrations (Acumatica, Sage, Dynamics)</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <BarChart3 className="h-5 w-5 text-purple-500 shrink-0" />
                    <span>Advanced reporting & analytics</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Key className="h-5 w-5 text-purple-500 shrink-0" />
                    <span>API access for custom integrations</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Sparkles className="h-5 w-5 text-purple-500 shrink-0" />
                    <span>Priority support</span>
                  </li>
                </ul>

                <Link href="/sign-in" className="block">
                  <Button className="w-full h-12 text-base bg-gradient-to-r from-purple-600 to-blue-600 hover:opacity-90 shadow-lg shadow-purple-500/25">
                    Start Free Trial <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>

          <p className="text-center text-muted-foreground mt-8">
            Need custom enterprise pricing?{' '}
            <Link href="/contact" className="text-purple-600 hover:text-purple-700 font-medium">
              Contact us
            </Link>
          </p>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 relative overflow-hidden">
        {/* Rich gradient background */}
        <div className="absolute inset-0 -z-10 gradient-mesh opacity-30"></div>
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-purple-500/20 rounded-full blur-[150px]"></div>
        </div>

        <div className="container mx-auto px-4 text-center relative z-10">
          <h2 className="font-display text-4xl md:text-7xl font-black mb-8 tracking-tight leading-[1.1]">
            Ready to Transform Your<br />
            <span className="text-gradient">
              Commission Process?
            </span>
          </h2>
          <p className="text-lg md:text-2xl text-muted-foreground mb-12 max-w-3xl mx-auto leading-relaxed">
            Join hundreds of forward-thinking companies that have eliminated commission headaches forever.
          </p>
          <div className="flex flex-col sm:flex-row gap-5 justify-center">
            <Link href="/sign-in">
              <Button size="lg" className="px-12 h-16 text-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:opacity-90 shadow-2xl shadow-purple-500/30 transition-all hover:shadow-purple-500/40 hover:-translate-y-1">
                Start Your Free Trial <ArrowRight className="ml-3 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="outline" size="lg" className="px-12 h-16 text-lg border-2 hover:bg-primary/5 transition-all hover:-translate-y-1">
                View Demo Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-16 bg-muted/20">
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
              <Link href="/privacy" className="text-muted-foreground hover:text-foreground transition-colors">Privacy</Link>
              <Link href="/terms" className="text-muted-foreground hover:text-foreground transition-colors">Terms</Link>
              <Link href="/contact" className="text-muted-foreground hover:text-foreground transition-colors">Contact</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
  gradient
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  gradient: string;
}) {
  return (
    <Card className="group relative overflow-hidden border-0 bg-card/50 backdrop-blur-sm shadow-xl shadow-black/5 hover:shadow-2xl transition-all duration-500 hover:-translate-y-2">
      {/* Hover gradient overlay */}
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient.replace('from-', 'from-').replace('to-', 'to-')}/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
      {/* Subtle border glow on hover */}
      <div className="absolute inset-0 rounded-xl border border-white/10 group-hover:border-white/20 transition-colors duration-500"></div>
      <CardHeader className="relative">
        <div className={`h-14 w-14 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-5 shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-500`}>
          <div className="text-white">{icon}</div>
        </div>
        <CardTitle className="font-display text-xl font-bold">{title}</CardTitle>
      </CardHeader>
      <CardContent className="relative">
        <p className="text-muted-foreground leading-relaxed">{description}</p>
      </CardContent>
    </Card>
  );
}

