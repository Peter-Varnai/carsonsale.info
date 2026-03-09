export interface CountryStats {
  code: string;
  avgPrice: number;
  medianPrice: number;
  count: number;
  minPrice: number;
  maxPrice: number;
}

export interface ArbitrageResponse {
  countries: CountryStats[];
  overallAvg: number;
  priceRange: {
    min: number;
    max: number;
  };
}
