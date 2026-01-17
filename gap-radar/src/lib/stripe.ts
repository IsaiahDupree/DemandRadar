import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  typescript: true,
});

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
