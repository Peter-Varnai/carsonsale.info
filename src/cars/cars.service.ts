import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, SelectQueryBuilder } from 'typeorm';
import { Car } from './entities/car.entity';
import {
    CarsResponse,
    ArbitrageResponse,
    CountryStats,
} from '../types/car.types';

@Injectable()
export class CarsService {
    private readonly logger = new Logger(CarsService.name);

    constructor(
        @InjectRepository(Car)
        private readonly carRepository: Repository<Car>,
    ) { }

    getHome(): { 'carsonsale.info': string } {
        return { 'carsonsale.info': '' };
    }

    async getCarsByBrand(carBrands: string): Promise<CarsResponse> {
        const brands = carBrands.includes(',') ? carBrands.split(',') : [carBrands];
        const cars = await this.carRepository.find({
            where: { manufacturer: In(brands) },
        });

        if (cars.length === 0) {
            throw new NotFoundException(`No cars found for brand(s): ${carBrands}`);
        }

        const ccSet = new Set<string>();
        const data = cars.map((car) => ({
            id: car.id,
            dateOfManufacturing: car.dateOfManufacturing,
            enginePower: car.enginePower,
            fuelType: car.fuelType,
            latitudeCoordinates: car.latitudeCoordinates,
            longitudeCoordinates: car.longitudeCoordinates,
            manufacturer: car.manufacturer,
            mileage: car.mileage,
            price: car.price,
            sellerCountryCode: car.sellerCountryCode,
            sellerLocation: car.sellerLocation,
        }));

        for (const car of cars) {
            ccSet.add(car.sellerCountryCode);
        }

        return {
            cc: Array.from(ccSet),
            data,
        };
    }

    async getArbitrageData(
        manufacturers?: string,
        fuelTypes?: string,
    ): Promise<ArbitrageResponse> {
        const ALLOWED_COUNTRIES = [
            'AT',
            'DE',
            'IT',
            'NL',
            'BE',
            'HU',
            'SK',
            'LU',
            'CZ',
            'PL',
            'CH',
        ];

        const brandList = manufacturers?.includes(',')
            ? manufacturers.split(',')
            : manufacturers
                ? [manufacturers]
                : [];
        const fuelList = fuelTypes?.includes(',')
            ? fuelTypes.split(',')
            : fuelTypes
                ? [fuelTypes]
                : [];

        let query: SelectQueryBuilder<Car> = this.carRepository
            .createQueryBuilder('car')
            .select('car.seller_country_code', 'code')
            .addSelect('AVG(car.price)', 'avgPrice')
            .addSelect('COUNT(*)', 'count')
            .where('car.seller_country_code IN (:...countries)', {
                countries: ALLOWED_COUNTRIES,
            })
            .groupBy('car.seller_country_code');

        if (brandList.length > 0) {
            query = query.andWhere('car.manufacturer IN (:...brands)', {
                brands: brandList,
            });
        }

        if (fuelList.length > 0) {
            query = query.andWhere('car.fuel_type IN (:...fuels)', {
                fuels: fuelList,
            });
        }

        const results: CountryStats[] = await query.getRawMany();

        const validResults = results.filter((r) => r.count > 0);

        const totalCount = validResults.reduce(
            (sum, r) => sum + parseInt(String(r.count)),
            0,
        );
        const overallAvg =
            validResults.reduce(
                (sum, r) =>
                    sum + parseFloat(String(r.avgPrice)) * parseInt(String(r.count)),
                0,
            ) / totalCount;

        const minPrice = Math.min(
            ...validResults.map((r) => parseFloat(String(r.avgPrice))),
        );
        const maxPrice = Math.max(
            ...validResults.map((r) => parseFloat(String(r.avgPrice))),
        );

        return {
            countries: validResults.map((r) => ({
                code: r.code,
                avgPrice: Math.round(parseFloat(String(r.avgPrice))),
                count: parseInt(String(r.count)),
                medianPrice: 0,
                minPrice: Math.round(minPrice),
                maxPrice: Math.round(maxPrice),
            })),
            overallAvg: Math.round(overallAvg),
            priceRange: {
                min: Math.round(minPrice),
                max: Math.round(maxPrice),
            },
        };
    }
}
