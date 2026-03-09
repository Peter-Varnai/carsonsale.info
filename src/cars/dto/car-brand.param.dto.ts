import { IsString, IsNotEmpty } from 'class-validator';
import { Transform } from 'class-transformer';

export class CarBrandParamDto {
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value?.trim())
  carBrands!: string;
}
