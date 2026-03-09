import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('cars')
export class Car {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'date_of_manufacturing' })
  dateOfManufacturing!: number;

  @Column({ name: 'engine_power' })
  enginePower!: number;

  @Column({ name: 'fuel_type' })
  fuelType!: string;

  @Column({ name: 'latitude_coordinates', type: 'real' })
  latitudeCoordinates!: number;

  @Column({ name: 'longitude_coordinates', type: 'real' })
  longitudeCoordinates!: number;

  @Column()
  manufacturer!: string;

  @Column()
  mileage!: number;

  @Column()
  price!: number;

  @Column({ name: 'seller_country_code' })
  sellerCountryCode!: string;

  @Column({ name: 'seller_location' })
  sellerLocation!: string;
}
