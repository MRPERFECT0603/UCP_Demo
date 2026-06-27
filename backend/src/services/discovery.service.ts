import axios from 'axios';
import { UCPMerchantMetadata } from '../types/index.js';
import { MERCHANTS } from '../config/merchants.js';

const metadataCache = new Map<string, UCPMerchantMetadata>();

export async function discoverMerchant(baseUrl: string, name: string): Promise<UCPMerchantMetadata | null> {
  const cached = metadataCache.get(baseUrl);
  if (cached) return cached;

  try {
    const { data } = await axios.get(`${baseUrl}/.well-known/ucp`, { timeout: 5000 });
    const metadata: UCPMerchantMetadata = { ...data, baseUrl };
    metadataCache.set(baseUrl, metadata);
    return metadata;
  } catch (err) {
    console.error(`Discovery failed for ${name} at ${baseUrl}:`, (err as Error).message);
    return null;
  }
}

export async function discoverAllMerchants(): Promise<UCPMerchantMetadata[]> {
  const results = await Promise.allSettled(
    MERCHANTS.map(m => discoverMerchant(m.baseUrl, m.name))
  );

  return results
    .filter((r): r is PromiseFulfilledResult<UCPMerchantMetadata> =>
      r.status === 'fulfilled' && r.value !== null
    )
    .map(r => r.value);
}

export function clearDiscoveryCache() {
  metadataCache.clear();
}
