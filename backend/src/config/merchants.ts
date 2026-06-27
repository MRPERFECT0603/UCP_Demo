export interface MerchantConfig {
  name: string;
  baseUrl: string;
}

export const MERCHANTS: MerchantConfig[] = [
  { name: 'Flipkart', baseUrl: 'http://localhost:3001' },
  { name: 'Myntra', baseUrl: 'http://localhost:3002' }
];
