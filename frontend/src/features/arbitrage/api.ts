import type { ArbitrageFilters } from './queryKeys';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

function buildQueryString(filters: ArbitrageFilters): string {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      params.append(key, String(value));
    }
  });

  return params.toString();
}

export interface CountryPairResult {
  buy_country: string;
  sell_country: string;
  avg_price_delta: number;
  sample_size: number;
}

export interface ScoredListing {
  id: number;
  manufacturer: string;
  price: number;
  mileage: number;
  enginePower: number;
  fuelType: string;
  sellerCountryCode: string;
  sellerLocation: string;
  dateOfManufacturing: number;
  latitudeCoordinates: number;
  longitudeCoordinates: number;
  predicted_sell_price: number;
  arbitrage_score: number;
}

export interface PriceBucket {
  bucket_min: number;
  bucket_max: number;
  count: number;
}

export interface PriceDistributionResult {
  country_a: PriceBucket[];
  country_b: PriceBucket[];
}

export interface RegressionPoint {
  mileage: number;
  price: number;
}

export interface RegressionDataResult {
  country: string;
  points: RegressionPoint[];
}

export interface PowerBucket {
  power_min: number;
  power_max: number;
  avg_price: number;
}

export interface PowerPriceResult {
  country: string;
  buckets: PowerBucket[];
}

export interface FlowDataResult {
  source_country: string;
  target_country: string;
  opportunity_count: number;
  avg_net_margin: number;
}

export interface ListingGeo {
  id: number;
  latitude_coordinates: number;
  longitude_coordinates: number;
  margin_estimate: number;
  manufacturer: string;
  price: number;
}

export async function fetchCountryPairMatrix(
  filters: ArbitrageFilters,
): Promise<CountryPairResult[]> {
  const queryString = buildQueryString(filters);
  const response = await fetch(
    `${API_URL}/api/arbitrage/country-pair-matrix${queryString ? `?${queryString}` : ''}`,
  );
  if (!response.ok) throw new Error('Failed to fetch country pair matrix');
  return response.json();
}

export async function fetchScoredListings(
  filters: ArbitrageFilters,
): Promise<ScoredListing[]> {
  const queryString = buildQueryString(filters);
  const response = await fetch(
    `${API_URL}/api/arbitrage/scored-listings${queryString ? `?${queryString}` : ''}`,
  );
  if (!response.ok) throw new Error('Failed to fetch scored listings');
  return response.json();
}

export async function fetchPriceDistribution(
  filters: ArbitrageFilters,
): Promise<PriceDistributionResult> {
  const queryString = buildQueryString(filters);
  const response = await fetch(
    `${API_URL}/api/arbitrage/price-distribution${queryString ? `?${queryString}` : ''}`,
  );
  if (!response.ok) throw new Error('Failed to fetch price distribution');
  return response.json();
}

export async function fetchRegressionData(
  filters: ArbitrageFilters,
): Promise<RegressionDataResult[]> {
  const queryString = buildQueryString(filters);
  const response = await fetch(
    `${API_URL}/api/arbitrage/regression-data${queryString ? `?${queryString}` : ''}`,
  );
  if (!response.ok) throw new Error('Failed to fetch regression data');
  return response.json();
}

export async function fetchPowerPriceByCountry(
  filters: ArbitrageFilters,
): Promise<PowerPriceResult[]> {
  const queryString = buildQueryString(filters);
  const response = await fetch(
    `${API_URL}/api/arbitrage/power-price-by-country${queryString ? `?${queryString}` : ''}`,
  );
  if (!response.ok) throw new Error('Failed to fetch power price data');
  return response.json();
}

export async function fetchFlowData(): Promise<FlowDataResult[]> {
  const response = await fetch(`${API_URL}/api/arbitrage/flow-data`);
  if (!response.ok) throw new Error('Failed to fetch flow data');
  return response.json();
}

export async function fetchListingsGeo(): Promise<ListingGeo[]> {
  const response = await fetch(`${API_URL}/api/arbitrage/listings-geo`);
  if (!response.ok) throw new Error('Failed to fetch listings geo');
  return response.json();
}
