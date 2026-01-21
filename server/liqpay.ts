import crypto from 'crypto';

const LIQPAY_PUBLIC_KEY = process.env.LIQPAY_PUBLIC_KEY || '';
const LIQPAY_PRIVATE_KEY = process.env.LIQPAY_PRIVATE_KEY || '';

export function isLiqPayConfigured(): boolean {
  return Boolean(LIQPAY_PUBLIC_KEY && LIQPAY_PRIVATE_KEY);
}

interface LiqPayParams {
  version: number;
  public_key: string;
  action: string;
  amount: number;
  currency: string;
  description: string;
  order_id: string;
  result_url?: string;
  server_url?: string;
  language?: string;
}

function base64Encode(data: string): string {
  return Buffer.from(data).toString('base64');
}

function createSignature(data: string): string {
  const signString = LIQPAY_PRIVATE_KEY + data + LIQPAY_PRIVATE_KEY;
  return crypto.createHash('sha1').update(signString).digest('base64');
}

export function createPaymentData(params: {
  orderId: string;
  amount: number;
  description: string;
  resultUrl: string;
  serverUrl: string;
  language?: string;
}): { data: string; signature: string } {
  const paymentParams: LiqPayParams = {
    version: 3,
    public_key: LIQPAY_PUBLIC_KEY,
    action: 'pay',
    amount: params.amount,
    currency: 'UAH',
    description: params.description,
    order_id: params.orderId,
    result_url: params.resultUrl,
    server_url: params.serverUrl,
    language: params.language || 'uk',
  };

  const data = base64Encode(JSON.stringify(paymentParams));
  const signature = createSignature(data);

  return { data, signature };
}

export function verifyCallback(data: string, signature: string): boolean {
  const expectedSignature = createSignature(data);
  return signature === expectedSignature;
}

export function parseCallbackData(data: string): any {
  try {
    const decoded = Buffer.from(data, 'base64').toString('utf-8');
    return JSON.parse(decoded);
  } catch (error) {
    console.error('Failed to parse LiqPay callback data:', error);
    return null;
  }
}

export function getLiqPayCheckoutUrl(): string {
  return 'https://www.liqpay.ua/api/3/checkout';
}

export function getPaymentStatus(status: string): 'pending' | 'success' | 'failed' {
  const successStatuses = ['success', 'sandbox'];
  const failedStatuses = ['failure', 'error', 'reversed'];
  
  if (successStatuses.includes(status)) return 'success';
  if (failedStatuses.includes(status)) return 'failed';
  return 'pending';
}
