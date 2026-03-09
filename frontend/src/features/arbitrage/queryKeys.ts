export const arbitrageKeys = {
  all: ['arbitrage'] as const,

  countryPairMatrix: (filters: ArbitrageFilters) =>
    [...arbitrageKeys.all, 'countryPairMatrix', filters] as const,

  scoredListings: (filters: ArbitrageFilters) =>
    [...arbitrageKeys.all, 'scoredListings', filters] as const,

  priceDistribution: (filters: ArbitrageFilters) =>
    [...arbitrageKeys.all, 'priceDistribution', filters] as const,

  regressionData: (filters: ArbitrageFilters) =>
    [...arbitrageKeys.all, 'regressionData', filters] as const,

  powerPriceByCountry: (filters: ArbitrageFilters) =>
    [...arbitrageKeys.all, 'powerPriceByCountry', filters] as const,

  flowData: () => [...arbitrageKeys.all, 'flowData'] as const,

  listingsGeo: () => [...arbitrageKeys.all, 'listingsGeo'] as const,
};

export interface ArbitrageFilters {
  manufacturer?: string;
  fuel_type?: string;
  engine_power_min?: number;
  engine_power_max?: number;
  mileage_max?: number;
  mileage_bracket?: string;
  date_of_manufacturing_min?: number;
  date_of_manufacturing_max?: number;
  source_country?: string;
  target_country?: string;
  country_a?: string;
  country_b?: string;
  mileage_min?: number;
}

export const defaultArbitrageFilters: ArbitrageFilters = {
  manufacturer: undefined,
  fuel_type: undefined,
  engine_power_min: undefined,
  engine_power_max: undefined,
  mileage_max: undefined,
  mileage_bracket: undefined,
  date_of_manufacturing_min: undefined,
  date_of_manufacturing_max: undefined,
  source_country: undefined,
  target_country: undefined,
  country_a: 'DE',
  country_b: 'PL',
  mileage_min: undefined,
};
