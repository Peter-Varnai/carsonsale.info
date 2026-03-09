import {
  Controller,
  Get,
  Param,
  Query,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { CarsService } from './cars.service';
import { CarBrandParamDto } from './dto/car-brand.param.dto';
import type { HomeResponse } from '../types/api.types';
import type { CarsResponse, ArbitrageResponse } from '../types/car.types';

@Controller()
export class CarsController {
  constructor(private readonly carsService: CarsService) {}

  @Get()
  getHome(): HomeResponse {
    return this.carsService.getHome();
  }

  @Get('analytics/arbitrage')
  getArbitrageData(
    @Query('manufacturers') manufacturers?: string,
    @Query('fuelTypes') fuelTypes?: string,
  ): Promise<ArbitrageResponse> {
    return this.carsService.getArbitrageData(manufacturers, fuelTypes);
  }

  @Get(':carBrands')
  @UsePipes(new ValidationPipe({ transform: true }))
  getCarsByBrand(
    @Param() params: CarBrandParamDto,
  ): Promise<CarsResponse | never> {
    return this.carsService.getCarsByBrand(params.carBrands);
  }
}
