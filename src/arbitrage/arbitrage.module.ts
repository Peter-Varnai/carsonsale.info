import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ArbitrageController } from './arbitrage.controller';
import { ArbitrageService } from './arbitrage.service';
import { Car } from '../cars/entities/car.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Car])],
  controllers: [ArbitrageController],
  providers: [ArbitrageService],
})
export class ArbitrageModule {}
