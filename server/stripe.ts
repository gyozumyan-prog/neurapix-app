import Stripe from 'stripe';

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || '';
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || '';

let stripeClient: Stripe | null = null;

function getStripe(): Stripe | null {
  if (!STRIPE_SECRET_KEY) return null;
  if (!stripeClient) {
    stripeClient = new Stripe(STRIPE_SECRET_KEY, { apiVersion: '2024-12-18.acacia' });
  }
  return stripeClient;
}

export function isStripeConfigured(): boolean {
  return Boolean(STRIPE_SECRET_KEY);
}

export async function createCheckoutSession(params: {
  orderId: string;
  amount: number;
  currency: string;
  description: string;
  successUrl: string;
  cancelUrl: string;
  customerEmail?: string;
}): Promise<{ url: string; sessionId: string } | null> {
  const stripe = getStripe();
  if (!stripe) return null;

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: params.currency.toLowerCase(),
          product_data: {
            name: params.description,
          },
          unit_amount: Math.round(params.amount * 100),
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: params.successUrl,
      cancel_url: params.cancelUrl,
      customer_email: params.customerEmail,
      metadata: {
        order_id: params.orderId,
      },
    });

    return {
      url: session.url || '',
      sessionId: session.id,
    };
  } catch (error) {
    console.error('Stripe checkout session error:', error);
    return null;
  }
}

export function verifyWebhook(payload: string | Buffer, signature: string): Stripe.Event | null {
  const stripe = getStripe();
  if (!stripe || !STRIPE_WEBHOOK_SECRET) return null;

  try {
    return stripe.webhooks.constructEvent(payload, signature, STRIPE_WEBHOOK_SECRET);
  } catch (error) {
    console.error('Stripe webhook verification failed:', error);
    return null;
  }
}

export function getPaymentStatus(status: string): 'pending' | 'success' | 'failed' {
  if (status === 'complete' || status === 'paid') return 'success';
  if (status === 'expired' || status === 'canceled') return 'failed';
  return 'pending';
}
