import crypto from 'crypto';

const FONDY_MERCHANT_ID = process.env.FONDY_MERCHANT_ID || '';
const FONDY_SECRET_KEY = process.env.FONDY_SECRET_KEY || '';

export function isFondyConfigured(): boolean {
  return Boolean(FONDY_MERCHANT_ID && FONDY_SECRET_KEY);
}

function createSignature(params: Record<string, string | number>): string {
  const sortedKeys = Object.keys(params).sort();
  const signatureString = sortedKeys
    .filter(key => params[key] !== '' && params[key] !== undefined)
    .map(key => params[key])
    .join('|');
  
  return crypto
    .createHash('sha1')
    .update(FONDY_SECRET_KEY + '|' + signatureString)
    .digest('hex');
}

export async function createPayment(params: {
  orderId: string;
  amount: number;
  currency: string;
  description: string;
  responseUrl: string;
  callbackUrl: string;
  language?: string;
}): Promise<{ checkoutUrl: string; paymentId: string } | null> {
  const requestParams: Record<string, string | number> = {
    order_id: params.orderId,
    merchant_id: FONDY_MERCHANT_ID,
    order_desc: params.description,
    amount: Math.round(params.amount * 100),
    currency: params.currency,
    response_url: params.responseUrl,
    server_callback_url: params.callbackUrl,
    lang: params.language || 'uk',
  };

  requestParams.signature = createSignature(requestParams);

  try {
    const response = await fetch('https://pay.fondy.eu/api/checkout/url/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ request: requestParams }),
    });

    const data = await response.json();
    
    if (data.response?.checkout_url) {
      return {
        checkoutUrl: data.response.checkout_url,
        paymentId: data.response.payment_id || params.orderId,
      };
    }
    
    console.error('Fondy error:', data);
    return null;
  } catch (error) {
    console.error('Fondy payment error:', error);
    return null;
  }
}

export function verifyCallback(params: Record<string, string>): boolean {
  const receivedSignature = params.signature;
  if (!receivedSignature) return false;

  const paramsForSign = { ...params };
  delete paramsForSign.signature;
  
  const expectedSignature = createSignature(paramsForSign);
  return receivedSignature === expectedSignature;
}

export function getPaymentStatus(status: string): 'pending' | 'success' | 'failed' {
  if (status === 'approved') return 'success';
  if (status === 'declined' || status === 'expired' || status === 'reversed') return 'failed';
  return 'pending';
}
