import { Controller, Get, Query } from '@nestjs/common';
import { ArbitrageService } from './arbitrage.service';

@Controller('api/arbitrage')
export class ArbitrageController {
  constructor(private readonly arbitrageService: ArbitrageService) {}

  @Get('country-pair-matrix')
  getCountryPairMatrix(
    @Query('manufacturer') manufacturer?: string,
    @Query('fuel_type') fuel_type?: string,
    @Query('mileage_bracket') mileage_bracket?: string,
  ) {
    return this.arbitrageService.getCountryPairMatrix(
      manufacturer,
      fuel_type,
      mileage_bracket,
    );
  }

  @Get('scored-listings')
  getScoredListings(
    @Query('manufacturer') manufacturer?: string,
    @Query('fuel_type') fuel_type?: string,
    @Query('engine_power_min') engine_power_min?: string,
    @Query('engine_power_max') engine_power_max?: string,
    @Query('mileage_max') mileage_max?: string,
    @Query('source_country') source_country?: string,
    @Query('target_country') target_country?: string,
  ) {
    return this.arbitrageService.getScoredListings(
      manufacturer,
      fuel_type,
      engine_power_min ? parseInt(engine_power_min) : undefined,
      engine_power_max ? parseInt(engine_power_max) : undefined,
      mileage_max ? parseInt(mileage_max) : undefined,
      source_country,
      target_country,
    );
  }

  @Get('price-distribution')
  getPriceDistribution(
    @Query('country_a') country_a?: string,
    @Query('country_b') country_b?: string,
    @Query('manufacturer') manufacturer?: string,
    @Query('fuel_type') fuel_type?: string,
    @Query('mileage_min') mileage_min?: string,
    @Query('mileage_max') mileage_max?: string,
  ) {
    return this.arbitrageService.getPriceDistribution(
      country_a || 'DE',
      country_b || 'PL',
      manufacturer,
      fuel_type,
      mileage_min ? parseInt(mileage_min) : undefined,
      mileage_max ? parseInt(mileage_max) : undefined,
    );
  }

  @Get('regression-data')
  getRegressionData(
    @Query('manufacturer') manufacturer?: string,
    @Query('fuel_type') fuel_type?: string,
  ) {
    return this.arbitrageService.getRegressionData(manufacturer, fuel_type);
  }

  @Get('power-price-by-country')
  getPowerPriceByCountry(
    @Query('manufacturer') manufacturer?: string,
    @Query('fuel_type') fuel_type?: string,
  ) {
    return this.arbitrageService.getPowerPriceByCountry(
      manufacturer,
      fuel_type,
    );
  }

  @Get('flow-data')
  getFlowData() {
    return this.arbitrageService.getFlowData();
  }

  @Get('listings-geo')
  getListingsGeo() {
    return this.arbitrageService.getListingsGeo();
  }
}
