import { UCPMerchantMetadata } from '../types/index.js';
import { discoverAllMerchants, discoverMerchant, clearDiscoveryCache } from './discovery.service.js';
import { MERCHANTS } from '../config/merchants.js';

let cachedMerchants: UCPMerchantMetadata[] = [];

export async function getMerchants(): Promise<UCPMerchantMetadata[]> {
  if (cachedMerchants.length > 0) return cachedMerchants;
  cachedMerchants = await discoverAllMerchants();
  return cachedMerchants;
}

export function getMerchantByName(name: string): UCPMerchantMetadata | undefined {
  return cachedMerchants.find(
    m => m.merchant.toLowerCase() === name.toLowerCase()
  );
}

/** Force re-fetch a single merchant's UCP metadata (called before payment to get fresh capabilities). */
export async function refreshMerchantByName(name: string): Promise<UCPMerchantMetadata | undefined> {
  const config = MERCHANTS.find(m => m.name.toLowerCase() === name.toLowerCase());
  if (!config) return undefined;

  clearDiscoveryCache();
  const fresh = await discoverMerchant(config.baseUrl, config.name);
  if (fresh) {
    cachedMerchants = cachedMerchants.map(m =>
      m.merchant.toLowerCase() === name.toLowerCase() ? fresh : m
    );
    if (!cachedMerchants.find(m => m.merchant.toLowerCase() === name.toLowerCase())) {
      cachedMerchants.push(fresh);
    }
  }
  return fresh ?? undefined;
}

export function refreshMerchants(): void {
  cachedMerchants = [];
  clearDiscoveryCache();
}
