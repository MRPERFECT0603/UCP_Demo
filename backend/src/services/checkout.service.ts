import axios from 'axios';
import { CheckoutSession, OrderConfirmation, PaymentInitResult, UCPMerchantMetadata } from '../types/index.js';
import { refreshMerchantByName } from './merchant.service.js';

export async function createCheckout(
  merchant: UCPMerchantMetadata,
  productId: string,
  quantity: number = 1
): Promise<CheckoutSession> {
  const checkoutCap = merchant.capabilities.checkout;
  if (!checkoutCap) throw new Error(`${merchant.merchant} does not support checkout`);
  const { data } = await axios.post(`${merchant.baseUrl}${checkoutCap.endpoint}`, { productId, quantity }, { timeout: 5000 });
  return data;
}

export async function updateCheckout(
  merchant: UCPMerchantMetadata,
  sessionId: string,
  updates: { quantity?: number; couponCode?: string }
): Promise<CheckoutSession> {
  const checkoutCap = merchant.capabilities.checkout;
  if (!checkoutCap) throw new Error(`${merchant.merchant} does not support checkout`);
  const { data } = await axios.put(`${merchant.baseUrl}${checkoutCap.endpoint}/${sessionId}`, updates, { timeout: 5000 });
  return data;
}

export async function initPayment(
  merchant: UCPMerchantMetadata,
  sessionId: string
): Promise<PaymentInitResult> {
  // Always re-discover so we get the latest UCP capabilities after a server restart
  const fresh = await refreshMerchantByName(merchant.merchant) ?? merchant;
  const paymentCap = fresh.capabilities.payment as any;

  if (!paymentCap) throw new Error(`${fresh.merchant} does not support payment`);

  // Support both new shape (initEndpoint) and old shape (endpoint)
  const rawEndpoint: string = paymentCap.initEndpoint ?? paymentCap.endpoint;
  if (!rawEndpoint) throw new Error(`${fresh.merchant} payment capability has no endpoint`);

  const endpoint = rawEndpoint.replace(':sessionId', sessionId);
  const { data } = await axios.post(`${fresh.baseUrl}${endpoint}`, {}, { timeout: 5000 });
  return { ...data, sessionId };
}

export async function verifyPayment(
  merchant: UCPMerchantMetadata,
  sessionId: string,
  paymentToken: string,
  method: string
): Promise<OrderConfirmation> {
  const fresh = await refreshMerchantByName(merchant.merchant) ?? merchant;
  const paymentCap = fresh.capabilities.payment as any;

  if (!paymentCap) throw new Error(`${fresh.merchant} does not support payment`);

  // Support both new shape (verifyEndpoint) and old shape (endpoint)
  const rawEndpoint: string = paymentCap.verifyEndpoint ?? paymentCap.endpoint;
  if (!rawEndpoint) throw new Error(`${fresh.merchant} payment capability has no verify endpoint`);

  const endpoint = rawEndpoint.replace(':sessionId', sessionId);
  const { data } = await axios.post(`${fresh.baseUrl}${endpoint}`, { paymentToken, method }, { timeout: 5000 });
  return data;
}
