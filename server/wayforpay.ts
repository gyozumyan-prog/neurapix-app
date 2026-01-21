import crypto from 'crypto';

const WAYFORPAY_MERCHANT_ACCOUNT = process.env.WAYFORPAY_MERCHANT_ACCOUNT || '';
const WAYFORPAY_MERCHANT_SECRET = process.env.WAYFORPAY_MERCHANT_SECRET || '';
const WAYFORPAY_MERCHANT_DOMAIN = process.env.WAYFORPAY_MERCHANT_DOMAIN || '';

export function isWayForPayConfigured(): boolean {
  return Boolean(WAYFORPAY_MERCHANT_ACCOUNT && WAYFORPAY_MERCHANT_SECRET);
}

function hmacMd5(data: string): string {
  return crypto
    .createHmac('md5', WAYFORPAY_MERCHANT_SECRET)
    .update(data)
    .digest('hex');
}

export function createPaymentForm(params: {
  orderId: string;
  amount: number;
  currency: string;
  productName: string;
  productCount: number;
  productPrice: number;
  returnUrl: string;
  serviceUrl: string;
  language?: string;
}): Record<string, string | number> {
  const orderDate = Math.floor(Date.now() / 1000);
  
  const signatureString = [
    WAYFORPAY_MERCHANT_ACCOUNT,
    WAYFORPAY_MERCHANT_DOMAIN,
    params.orderId,
    orderDate,
    params.amount,
    params.currency,
    params.productName,
    params.productCount,
    params.productPrice,
  ].join(';');

  const signature = hmacMd5(signatureString);

  return {
    merchantAccount: WAYFORPAY_MERCHANT_ACCOUNT,
    merchantDomainName: WAYFORPAY_MERCHANT_DOMAIN,
    merchantSignature: signature,
    orderReference: params.orderId,
    orderDate: orderDate,
    amount: params.amount,
    currency: params.currency,
    productName: params.productName,
    productCount: params.productCount,
    productPrice: params.productPrice,
    returnUrl: params.returnUrl,
    serviceUrl: params.serviceUrl,
    language: params.language || 'UA',
  };
}

export function getCheckoutUrl(): string {
  return 'https://secure.wayforpay.com/pay';
}

export function verifyCallback(params: Record<string, string>): boolean {
  const receivedSignature = params.merchantSignature;
  if (!receivedSignature) return false;

  const signatureString = [
    params.merchantAccount,
    params.orderReference,
    params.amount,
    params.currency,
    params.authCode,
    params.cardPan,
    params.transactionStatus,
    params.reasonCode,
  ].join(';');

  const expectedSignature = hmacMd5(signatureString);
  return receivedSignature === expectedSignature;
}

export function getPaymentStatus(status: string): 'pending' | 'success' | 'failed' {
  if (status === 'Approved') return 'success';
  if (status === 'Declined' || status === 'Expired' || status === 'Refunded') return 'failed';
  return 'pending';
}

export function createCallbackResponse(orderId: string, status: 'accept' | 'refuse', time?: number): Record<string, string | number> {
  const responseTime = time || Math.floor(Date.now() / 1000);
  const signatureString = [orderId, status, responseTime].join(';');
  
  return {
    orderReference: orderId,
    status: status,
    time: responseTime,
    signature: hmacMd5(signatureString),
  };
}
