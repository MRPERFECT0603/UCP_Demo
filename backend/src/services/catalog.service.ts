import axios from 'axios';
import { Product, SearchFilters, UCPMerchantMetadata } from '../types/index.js';

export async function searchMerchantCatalog(
  merchant: UCPMerchantMetadata,
  filters: SearchFilters
): Promise<Product[]> {
  const catalogCap = merchant.capabilities.catalog;
  if (!catalogCap) return [];

  const url = `${merchant.baseUrl}${catalogCap.endpoint}`;
  const params: Record<string, string | number> = {};

  if (filters.query) params.q = filters.query;
  if (filters.brand) params.brand = filters.brand;
  if (filters.color) params.color = filters.color;
  if (filters.maxPrice !== undefined) params.maxPrice = filters.maxPrice;
  if (filters.minPrice !== undefined) params.minPrice = filters.minPrice;
  if (filters.category) params.category = filters.category;

  try {
    const { data } = await axios.get(url, { params, timeout: 5000 });
    return (data.products || []).map((p: any) => ({ ...p, merchant: merchant.merchant }));
  } catch (err) {
    console.error(`Catalog search failed for ${merchant.merchant}:`, (err as Error).message);
    return [];
  }
}

export async function searchAllMerchants(
  merchants: UCPMerchantMetadata[],
  filters: SearchFilters
): Promise<Product[]> {
  const results = await Promise.allSettled(
    merchants.map(m => searchMerchantCatalog(m, filters))
  );

  const allProducts = results
    .filter((r): r is PromiseFulfilledResult<Product[]> => r.status === 'fulfilled')
    .flatMap(r => r.value);

  // Sort by price ascending
  return allProducts.sort((a, b) => a.price - b.price);
}
