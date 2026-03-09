import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Car } from '../cars/entities/car.entity';

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

const getMileageBracket = (mileage: number): string => {
  if (mileage <= 50000) return '0-50k';
  if (mileage <= 100000) return '50k-100k';
  if (mileage <= 150000) return '100k-150k';
  return '150k+';
};

@Injectable()
export class ArbitrageService {
  constructor(
    @InjectRepository(Car)
    private carsRepository: Repository<Car>,
  ) {}

  async getCountryPairMatrix(
    manufacturer?: string,
    fuel_type?: string,
    mileage_bracket?: string,
  ): Promise<CountryPairResult[]> {
    const validBrackets = ['0-50k', '50k-100k', '100k-150k', '150k+'];
    const bracket =
      mileage_bracket && validBrackets.includes(mileage_bracket)
        ? mileage_bracket
        : null;

    let query = this.carsRepository
      .createQueryBuilder('car')
      .select('car.seller_country_code', 'buy_country');

    if (bracket) {
      query = query.addSelect(
        `CASE 
          WHEN car.mileage <= 50000 THEN '0-50k'
          WHEN car.mileage <= 100000 THEN '50k-100k'
          WHEN car.mileage <= 150000 THEN '100k-150k'
          ELSE '150k+'
        END`,
        'mileage_bracket',
      );
    }

    query = query
      .addSelect('car.seller_country_code', 'sell_country')
      .addSelect('AVG(car.price)', 'avg_price_delta')
      .addSelect('COUNT(*)', 'sample_size')
      .groupBy('car.seller_country_code');

    if (manufacturer) {
      query = query.andWhere('car.manufacturer = :manufacturer', {
        manufacturer,
      });
    }
    if (fuel_type) {
      query = query.andWhere('car.fuel_type = :fuel_type', { fuel_type });
    }
    if (bracket) {
      query = query.andWhere(
        `CASE 
          WHEN car.mileage <= 50000 THEN '0-50k'
          WHEN car.mileage <= 100000 THEN '50k-100k'
          WHEN car.mileage <= 150000 THEN '100k-150k'
          ELSE '150k+'
        END = :bracket`,
        { bracket },
      );
    }

    const results = await query.getRawMany();

    const countries = [...new Set(results.map((r) => r.buy_country))];
    const matrix: CountryPairResult[] = [];

    for (const buyCountry of countries) {
      for (const sellCountry of countries) {
        if (buyCountry === sellCountry) continue;

        const buyResults = results.filter((r) => r.buy_country === buyCountry);
        const sellResults = results.filter(
          (r) => r.sell_country === sellCountry,
        );

        const buyAvg =
          buyResults.length > 0
            ? buyResults.reduce(
                (sum, r) => sum + parseFloat(r.avg_price_delta),
                0,
              ) / buyResults.length
            : 0;
        const sellAvg =
          sellResults.length > 0
            ? sellResults.reduce(
                (sum, r) => sum + parseFloat(r.avg_price_delta),
                0,
              ) / sellResults.length
            : 0;

        const sampleSize =
          buyResults.length > 0 && sellResults.length > 0
            ? Math.min(
                ...buyResults.map((r) => parseInt(r.sample_size)),
                ...sellResults.map((r) => parseInt(r.sample_size)),
              )
            : 0;

        matrix.push({
          buy_country: buyCountry,
          sell_country: sellCountry,
          avg_price_delta: Math.round(sellAvg - buyAvg),
          sample_size: sampleSize,
        });
      }
    }

    return matrix;
  }

  async getScoredListings(
    manufacturer?: string,
    fuel_type?: string,
    engine_power_min?: number,
    engine_power_max?: number,
    mileage_max?: number,
    source_country?: string,
    target_country?: string,
  ): Promise<ScoredListing[]> {
    let query = this.carsRepository.createQueryBuilder('car');

    if (manufacturer) {
      query = query.andWhere('car.manufacturer = :manufacturer', {
        manufacturer,
      });
    }
    if (fuel_type) {
      query = query.andWhere('car.fuel_type = :fuel_type', { fuel_type });
    }
    if (engine_power_min) {
      query = query.andWhere('car.engine_power >= :enginePowerMin', {
        enginePowerMin: engine_power_min,
      });
    }
    if (engine_power_max) {
      query = query.andWhere('car.engine_power <= :enginePowerMax', {
        enginePowerMax: engine_power_max,
      });
    }
    if (mileage_max) {
      query = query.andWhere('car.mileage <= :mileageMax', {
        mileageMax: mileage_max,
      });
    }
    if (source_country) {
      query = query.andWhere('car.seller_country_code = :sourceCountry', {
        sourceCountry: source_country,
      });
    }

    const listings = await query.getMany();

    const scoredListings: ScoredListing[] = [];

    for (const car of listings) {
      const bracket = getMileageBracket(car.mileage);

      let medianQuery = this.carsRepository
        .createQueryBuilder('c')
        .select('AVG(c.price)', 'median')
        .where('c.manufacturer = :manufacturer', {
          manufacturer: car.manufacturer,
        })
        .andWhere('c.fuel_type = :fuelType', { fuelType: car.fuelType })
        .andWhere(
          `CASE 
            WHEN c.mileage <= 50000 THEN '0-50k'
            WHEN c.mileage <= 100000 THEN '50k-100k'
            WHEN c.mileage <= 150000 THEN '100k-150k'
            ELSE '150k+'
          END = :bracket`,
          { bracket },
        );

      if (target_country) {
        medianQuery = medianQuery.andWhere(
          'c.seller_country_code = :targetCountry',
          { targetCountry: target_country },
        );
      } else {
        medianQuery = medianQuery.andWhere(
          'c.seller_country_code != :excludeCountry',
          { excludeCountry: car.sellerCountryCode },
        );
      }

      const targetMarketData = await medianQuery.getRawOne();
      const predictedSellPrice = parseFloat(targetMarketData?.median || '0');
      const arbitrageScore = predictedSellPrice - car.price;

      scoredListings.push({
        ...car,
        predicted_sell_price: Math.round(predictedSellPrice),
        arbitrage_score: Math.round(arbitrageScore),
      });
    }

    return scoredListings;
  }

  async getPriceDistribution(
    country_a: string,
    country_b: string,
    manufacturer?: string,
    fuel_type?: string,
    mileage_min?: number,
    mileage_max?: number,
  ): Promise<PriceDistributionResult> {
    const getBuckets = async (country: string): Promise<PriceBucket[]> => {
      let query = this.carsRepository
        .createQueryBuilder('car')
        .select('MIN(car.price)', 'minPrice')
        .addSelect('MAX(car.price)', 'maxPrice')
        .where('car.seller_country_code = :country', { country });

      if (manufacturer) {
        query = query.andWhere('car.manufacturer = :manufacturer', {
          manufacturer,
        });
      }
      if (fuel_type) {
        query = query.andWhere('car.fuel_type = :fuelType', {
          fuelType: fuel_type,
        });
      }
      if (mileage_min) {
        query = query.andWhere('car.mileage >= :mileageMin', {
          mileageMin: mileage_min,
        });
      }
      if (mileage_max) {
        query = query.andWhere('car.mileage <= :mileageMax', {
          mileageMax: mileage_max,
        });
      }

      const priceRange = await query.getRawOne();
      const minPrice = parseInt(priceRange?.minPrice || '0');
      const maxPrice = parseInt(priceRange?.maxPrice || '100000');
      const bucketWidth = Math.max(Math.ceil((maxPrice - minPrice) / 20), 1000);

      let bucketQuery = this.carsRepository
        .createQueryBuilder('car')
        .select(
          `CAST(car.price / ${bucketWidth} AS INTEGER) * ${bucketWidth}`,
          'bucket_min',
        )
        .addSelect(
          `(CAST(car.price / ${bucketWidth} AS INTEGER) + 1) * ${bucketWidth}`,
          'bucket_max',
        )
        .addSelect('COUNT(*)', 'count')
        .where('car.seller_country_code = :country', { country })
        .groupBy(`CAST(car.price / ${bucketWidth} AS INTEGER) * ${bucketWidth}`)
        .orderBy('bucket_min', 'ASC');

      if (manufacturer) {
        bucketQuery = bucketQuery.andWhere('car.manufacturer = :manufacturer', {
          manufacturer,
        });
      }
      if (fuel_type) {
        bucketQuery = bucketQuery.andWhere('car.fuel_type = :fuelType', {
          fuelType: fuel_type,
        });
      }
      if (mileage_min) {
        bucketQuery = bucketQuery.andWhere('car.mileage >= :mileageMin', {
          mileageMin: mileage_min,
        });
      }
      if (mileage_max) {
        bucketQuery = bucketQuery.andWhere('car.mileage <= :mileageMax', {
          mileageMax: mileage_max,
        });
      }

      const buckets = await bucketQuery.getRawMany();
      return buckets.map((b) => ({
        bucket_min: parseInt(b.bucket_min),
        bucket_max: parseInt(b.bucket_max),
        count: parseInt(b.count),
      }));
    };

    const [bucketsA, bucketsB] = await Promise.all([
      getBuckets(country_a),
      getBuckets(country_b),
    ]);

    return { country_a: bucketsA, country_b: bucketsB };
  }

  async getRegressionData(
    manufacturer?: string,
    fuel_type?: string,
  ): Promise<RegressionDataResult[]> {
    let query = this.carsRepository
      .createQueryBuilder('car')
      .select('car.seller_country_code', 'country')
      .addSelect('car.mileage', 'mileage')
      .addSelect('car.price', 'price')
      .orderBy('car.mileage', 'ASC');

    if (manufacturer) {
      query = query.andWhere('car.manufacturer = :manufacturer', {
        manufacturer,
      });
    }
    if (fuel_type) {
      query = query.andWhere('car.fuel_type = :fuelType', {
        fuelType: fuel_type,
      });
    }

    const results = await query.getRawMany();

    const groupedByCountry = new Map<string, RegressionPoint[]>();

    for (const row of results) {
      const country = row.country;
      if (!groupedByCountry.has(country)) {
        groupedByCountry.set(country, []);
      }
      groupedByCountry.get(country)!.push({
        mileage: parseInt(row.mileage),
        price: parseInt(row.price),
      });
    }

    return Array.from(groupedByCountry.entries()).map(([country, points]) => ({
      country,
      points: points.slice(0, 500),
    }));
  }

  async getPowerPriceByCountry(
    manufacturer?: string,
    fuel_type?: string,
  ): Promise<PowerPriceResult[]> {
    const bucketWidth = 50;

    let query = this.carsRepository
      .createQueryBuilder('car')
      .select('car.seller_country_code', 'country')
      .addSelect(
        `CAST(car.engine_power / ${bucketWidth} AS INTEGER) * ${bucketWidth}`,
        'power_min',
      )
      .addSelect(
        `(CAST(car.engine_power / ${bucketWidth} AS INTEGER) + 1) * ${bucketWidth}`,
        'power_max',
      )
      .addSelect('AVG(car.price)', 'avg_price')
      .groupBy('car.seller_country_code')
      .addGroupBy(
        `CAST(car.engine_power / ${bucketWidth} AS INTEGER) * ${bucketWidth}`,
      )
      .orderBy('power_min', 'ASC');

    if (manufacturer) {
      query = query.andWhere('car.manufacturer = :manufacturer', {
        manufacturer,
      });
    }
    if (fuel_type) {
      query = query.andWhere('car.fuel_type = :fuelType', {
        fuelType: fuel_type,
      });
    }

    const results = await query.getRawMany();

    const groupedByCountry = new Map<string, PowerBucket[]>();

    for (const row of results) {
      const country = row.country;
      if (!groupedByCountry.has(country)) {
        groupedByCountry.set(country, []);
      }
      groupedByCountry.get(country)!.push({
        power_min: parseInt(row.power_min),
        power_max: parseInt(row.power_max),
        avg_price: Math.round(parseFloat(row.avg_price)),
      });
    }

    return Array.from(groupedByCountry.entries()).map(([country, buckets]) => ({
      country,
      buckets,
    }));
  }

  async getFlowData(): Promise<FlowDataResult[]> {
    const countries = await this.carsRepository
      .createQueryBuilder('car')
      .select('DISTINCT car.seller_country_code', 'country')
      .getRawMany();

    const countryCodes = countries.map((c) => c.country);
    const flowResults: FlowDataResult[] = [];

    for (const source of countryCodes) {
      for (const target of countryCodes) {
        if (source === target) continue;

        const sourceAvgQuery = this.carsRepository
          .createQueryBuilder('c1')
          .select('AVG(c1.price)', 'avgPrice')
          .where('c1.seller_country_code = :country', { country: source })
          .getRawOne();

        const targetAvgQuery = this.carsRepository
          .createQueryBuilder('c2')
          .select('AVG(c2.price)', 'avgPrice')
          .where('c2.seller_country_code = :country', { country: target })
          .getRawOne();

        const [sourceAvg, targetAvg] = await Promise.all([
          sourceAvgQuery,
          targetAvgQuery,
        ]);

        const sourcePrice = parseFloat(sourceAvg?.avgPrice || '0');
        const targetPrice = parseFloat(targetAvg?.avgPrice || '0');
        const netMargin = targetPrice - sourcePrice;

        if (netMargin > 0) {
          const sourceCountQuery = await this.carsRepository
            .createQueryBuilder('c')
            .where('c.seller_country_code = :country', { country: source })
            .getCount();

          flowResults.push({
            source_country: source,
            target_country: target,
            opportunity_count: sourceCountQuery,
            avg_net_margin: Math.round(netMargin),
          });
        }
      }
    }

    return flowResults.sort((a, b) => b.avg_net_margin - a.avg_net_margin);
  }

  async getListingsGeo(): Promise<ListingGeo[]> {
    const listings = await this.carsRepository
      .createQueryBuilder('car')
      .select('car.id', 'id')
      .addSelect('car.latitude_coordinates', 'latitude_coordinates')
      .addSelect('car.longitude_coordinates', 'longitude_coordinates')
      .addSelect('car.manufacturer', 'manufacturer')
      .addSelect('car.price', 'price')
      .getRawMany();

    const countries = [...new Set(listings.map((l) => l.id))];

    const results: ListingGeo[] = [];

    for (const listing of listings) {
      const otherCountries = listings.filter((l) => l.id !== listing.id);

      let bestTargetPrice = 0;
      if (otherCountries.length > 0) {
        const prices = otherCountries.map((l) => parseInt(l.price));
        bestTargetPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
      }

      results.push({
        id: parseInt(listing.id),
        latitude_coordinates: parseFloat(listing.latitude_coordinates),
        longitude_coordinates: parseFloat(listing.longitude_coordinates),
        margin_estimate: Math.round(bestTargetPrice - parseInt(listing.price)),
        manufacturer: listing.manufacturer,
        price: parseInt(listing.price),
      });
    }

    return results;
  }
}
