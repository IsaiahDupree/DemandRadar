import Stripe from 'stripe';

// Lazy initialization to avoid build-time errors when env vars aren't set
let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY is not configured');
    }
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      typescript: true,
    });
  }
  return _stripe;
}

// For backward compatibility - will throw at runtime if not configured
export const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { typescript: true })
  : (null as unknown as Stripe);

export const PLANS = {
  free: {
    name: 'Free',
    price: 0,
    runsLimit: 2,
    features: ['2 runs/month', 'Basic reports', 'Community support'],
  },
  starter: {
    name: 'Starter',
    price: 29,
    priceId: process.env.STRIPE_STARTER_PRICE_ID,
    runsLimit: 2,
    features: ['2 runs/month', 'Full dossiers', 'Email support'],
  },
  builder: {
    name: 'Builder',
    price: 99,
    priceId: process.env.STRIPE_BUILDER_PRICE_ID,
    runsLimit: 10,
    features: ['10 runs/month', 'Full dossiers', 'UGC pack', 'Priority support'],
  },
  agency: {
    name: 'Agency',
    price: 249,
    priceId: process.env.STRIPE_AGENCY_PRICE_ID,
    runsLimit: 35,
    features: ['35 runs/month', 'Full dossiers', 'UGC pack', 'API access', 'Dedicated support'],
  },
  studio: {
    name: 'Studio',
    price: 499,
    priceId: process.env.STRIPE_STUDIO_PRICE_ID,
    runsLimit: 90,
    features: ['90 runs/month', 'Full dossiers', 'UGC pack', 'API access', 'White-label reports', 'Account manager'],
  },
} as const;

export type PlanKey = keyof typeof PLANS;

export function getPlanByPriceId(priceId: string): PlanKey | null {
  for (const [key, plan] of Object.entries(PLANS)) {
    if ('priceId' in plan && plan.priceId === priceId) {
      return key as PlanKey;
    }
  }
  return null;
}

export function getRunsLimit(plan: PlanKey): number {
  return PLANS[plan].runsLimit;
}

// Credit packages for one-off purchases
export const CREDIT_PACKAGES = {
  light: {
    name: 'Light Run',
    description: 'Vetted Idea Pack - light run with fewer ads/mentions',
    price: 49,
    credits: 1,
    priceId: process.env.STRIPE_CREDIT_LIGHT_PRICE_ID,
  },
  full: {
    name: 'Full Dossier',
    description: 'Deep run + 3 ad concepts + MVP spec + TAM/CAC model',
    price: 149,
    credits: 3,
    priceId: process.env.STRIPE_CREDIT_FULL_PRICE_ID,
  },
  agency: {
    name: 'Agency-ready',
    description: 'Deep run + landing page + 10 ad angles + objection handling + backlog',
    price: 399,
    credits: 10,
    priceId: process.env.STRIPE_CREDIT_AGENCY_PRICE_ID,
  },
} as const;

export type CreditPackageKey = keyof typeof CREDIT_PACKAGES;
