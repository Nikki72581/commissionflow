// app/page.tsx
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Zap, Shield, TrendingUp, Users, DollarSign } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <DollarSign className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">CommissionFlow</span>
          </div>
          <nav className="hidden md:flex items-center space-x-6">
            <Link href="#features" className="text-sm hover:text-primary">Features</Link>
            <Link href="#pricing" className="text-sm hover:text-primary">Pricing</Link>
            <Link href="/sign-in" className="text-sm hover:text-primary">Sign In</Link>
            <Button asChild>
              <Link href="/sign-up">Get Started</Link>
            </Button>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 md:py-32">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
            Sales Commission Management,{' '}
            <span className="text-primary">Simplified</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Stop wrestling with spreadsheets. Let AI help you design, calculate, and manage sales commissions with confidence.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg">
              <Link href="/sign-up">Start Free Trial</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="#pricing">View Pricing</Link>
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-4">No credit card required • 14-day free trial</p>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-16 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-6">The Commission Headache</h2>
            <div className="grid md:grid-cols-3 gap-6 text-left">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Spreadsheet Hell</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Manually tracking sales and calculating commissions in Excel is error-prone and time-consuming.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Lack of Transparency</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Salespeople can't see their earnings in real-time, leading to frustration and disputes.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Plan Complexity</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Designing fair commission structures that motivate without breaking the bank is difficult.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Everything You Need</h2>
            <p className="text-xl text-muted-foreground">Powerful features to streamline your commission workflow</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard
              icon={<Zap className="h-8 w-8 text-primary" />}
              title="AI-Powered Plan Builder"
              description="Let AI help you design commission structures or analyze existing plans for potential issues and optimization opportunities."
            />
            <FeatureCard
              icon={<TrendingUp className="h-8 w-8 text-primary" />}
              title="Automated Calculations"
              description="Import sales data and let CommissionFlow automatically calculate commissions based on your custom rules."
            />
            <FeatureCard
              icon={<Users className="h-8 w-8 text-primary" />}
              title="Salesperson Portal"
              description="Give your team real-time visibility into their earnings with beautiful dashboards and detailed breakdowns."
            />
            <FeatureCard
              icon={<Shield className="h-8 w-8 text-primary" />}
              title="Secure & Compliant"
              description="Enterprise-grade security with role-based access control and audit trails for all transactions."
            />
            <FeatureCard
              icon={<CheckCircle className="h-8 w-8 text-primary" />}
              title="Easy Integrations"
              description="Connect with your existing ERP, payment platforms, and HR systems for seamless data flow."
            />
            <FeatureCard
              icon={<DollarSign className="h-8 w-8 text-primary" />}
              title="Payout Management"
              description="Track, approve, and process commission payouts all in one place with complete transparency."
            />
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Simple, Transparent Pricing</h2>
            <p className="text-xl text-muted-foreground">Pay only for what you need. No hidden fees.</p>
          </div>

          <div className="grid md:grid-cols-4 gap-6 max-w-6xl mx-auto">
            <PricingCard
              name="Starter"
              price="$29"
              description="Perfect for small teams"
              features={[
                'Up to 5 salespeople',
                'Basic commission plans',
                'CSV import',
                'Email support',
              ]}
            />
            <PricingCard
              name="Growth"
              price="$79"
              description="For growing businesses"
              features={[
                'Up to 20 salespeople',
                'AI plan assistant',
                'Advanced analytics',
                'Priority support',
              ]}
              highlighted
            />
            <PricingCard
              name="Professional"
              price="$149"
              description="For established teams"
              features={[
                'Up to 50 salespeople',
                'API integrations',
                'Custom workflows',
                'Dedicated support',
              ]}
            />
            <PricingCard
              name="Enterprise"
              price="Custom"
              description="For large organizations"
              features={[
                'Unlimited salespeople',
                'White-label options',
                'SLA guarantees',
                'Account manager',
              ]}
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Transform Your Commission Process?
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join forward-thinking companies that have eliminated commission headaches.
          </p>
          <Button asChild size="lg">
            <Link href="/sign-up">Start Your Free Trial</Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 mt-auto">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>&copy; 2024 CommissionFlow. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <Card>
      <CardHeader>
        <div className="mb-2">{icon}</div>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

function PricingCard({ 
  name, 
  price, 
  description, 
  features, 
  highlighted = false 
}: { 
  name: string; 
  price: string; 
  description: string; 
  features: string[]; 
  highlighted?: boolean;
}) {
  return (
    <Card className={highlighted ? 'border-primary shadow-lg' : ''}>
      <CardHeader>
        <CardTitle className="text-2xl">{name}</CardTitle>
        <CardDescription>{description}</CardDescription>
        <div className="mt-4">
          <span className="text-4xl font-bold">{price}</span>
          {price !== 'Custom' && <span className="text-muted-foreground">/mo</span>}
        </div>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2 mb-6">
          {features.map((feature, i) => (
            <li key={i} className="flex items-start">
              <CheckCircle className="h-5 w-5 text-primary mr-2 flex-shrink-0" />
              <span className="text-sm">{feature}</span>
            </li>
          ))}
        </ul>
        <Button asChild className="w-full" variant={highlighted ? 'default' : 'outline'}>
          <Link href="/sign-up">Get Started</Link>
        </Button>
      </CardContent>
    </Card>
  );
}