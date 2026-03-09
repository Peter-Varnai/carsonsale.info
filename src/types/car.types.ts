export interface CarRecord {
  id: number;
  dateOfManufacturing: number;
  enginePower: number;
  fuelType: string;
  latitudeCoordinates: number;
  longitudeCoordinates: number;
  manufacturer: string;
  mileage: number;
  price: number;
  sellerCountryCode: string;
  sellerLocation: string;
}

export interface CarBrand {
  name: string;
}

export interface CarsResponse {
  cc: string[];
  data: CarRecord[];
}

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
