import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CarsModule } from './cars/cars.module';
import { ArbitrageModule } from './arbitrage/arbitrage.module';
import databaseConfig from './config/database.config';
import { Car } from './cars/entities/car.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'sqlite',
        database: configService.get<string>('database.path'),
        entities: [Car],
        synchronize: false,
      }),
    }),
    CarsModule,
    ArbitrageModule,
  ],
})
export class AppModule {}
