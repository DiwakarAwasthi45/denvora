import Link from "next/link";
import { ArrowRight, Building2, CalendarCheck2, Check, LayoutDashboard, Stethoscope, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { APP_NAME, APP_TRIAL_DAYS, PRICING } from "@/constants/config";

const features = [
  {
    icon: Stethoscope,
    title: "Clinical-first",
    description: "Interactive 32-tooth odontogram, tooth lifetime timelines and treatment plans.",
  },
  {
    icon: CalendarCheck2,
    title: "Smart scheduling",
    description: "Chair-aware appointments, recalls, no-show risk and queue management.",
  },
  {
    icon: Building2,
    title: "Built for clinics",
    description: "Billing, payments, inventory, labs and dashboards tailored to dental workflows.",
  },
  {
    icon: ShieldCheck,
    title: "Secure & multi-tenant",
    description: "Role-based access with strict clinic-level data isolation.",
  },
];

export default function LandingPage() {
  return (
    <>
      <section className="bg-gradient-to-b from-teal-50/60 to-white">
        <div className="mx-auto w-full max-w-6xl px-4 py-20 text-center sm:px-6 sm:py-28">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-xs font-medium text-teal-800">
            <LayoutDashboard className="size-3.5" />
            Dental clinic SaaS · Nepal-ready
          </p>
          <h1 className="mx-auto max-w-3xl text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
            Run your dental clinic like a professional practice
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-slate-600">
            {APP_NAME} connects patients, teeth, treatments, appointments, billing and follow-ups in
            one secure platform — with AI-powered business intelligence to grow your clinic.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button size="lg">
              <Link href="/register" className="inline-flex items-center gap-2">
                Start free trial <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline">
              <Link href="/login">Sign in</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <div key={feature.title} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex size-10 items-center justify-center rounded-lg bg-teal-50">
                <feature.icon className="size-5 text-teal-700" />
              </div>
              <h3 className="text-sm font-semibold text-slate-900">{feature.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="pricing" className="border-t border-slate-100 bg-slate-50/60">
        <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <div className="text-center">
            <p className="mb-3 text-xs font-medium uppercase tracking-wider text-teal-700">Pricing</p>
            <h2 className="text-3xl font-semibold tracking-tight text-slate-900">
              Simple pricing that scales with your clinic
            </h2>
            <p className="mt-3 text-slate-600">
              Start your {APP_TRIAL_DAYS}-day free trial on any plan. No credit card required.
            </p>
          </div>

          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            {PRICING.plans.map((plan) => (
              <div
                key={plan.name}
                className={
                  plan.popular
                    ? "relative rounded-2xl border-2 border-teal-600 bg-white p-7 shadow-lg shadow-teal-600/10"
                    : "relative rounded-2xl border border-slate-200 bg-white p-7 shadow-sm"
                }
              >
                {plan.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-teal-600 px-3 py-1 text-xs font-semibold text-white">
                    Most popular
                  </span>
                )}
                <h3 className="text-sm font-semibold text-slate-900">{plan.name}</h3>
                <p className="mt-1 text-sm text-slate-500">{plan.tagline}</p>
                <div className="mt-5 flex items-baseline gap-1">
                  <span className="text-3xl font-semibold tracking-tight text-slate-900">
                    {PRICING.currency} {plan.monthlyPrice.toLocaleString()}
                  </span>
                  <span className="text-sm text-slate-500">/month</span>
                </div>
                <ul className="mt-6 space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2.5 text-sm text-slate-600">
                      <Check className="mt-0.5 size-4 shrink-0 text-teal-600" aria-hidden />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Button
                  fullWidth
                  size="lg"
                  variant={plan.popular ? "primary" : "outline"}
                  className="mt-8"
                >
                  <Link href="/register" className="inline-flex w-full items-center justify-center gap-2">
                    Start free trial <ArrowRight className="size-4" />
                  </Link>
                </Button>
              </div>
            ))}
          </div>

          <p className="mt-8 text-center text-xs text-slate-400">
            All prices in {PRICING.currency}, billed monthly. Need a custom plan?{" "}
            <Link href="/contact" className="font-medium text-teal-700 hover:text-teal-800">
              Contact us
            </Link>
          </p>
        </div>
      </section>
    </>
  );
}
