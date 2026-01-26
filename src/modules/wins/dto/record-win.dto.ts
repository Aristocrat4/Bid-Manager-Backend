import { IsString, IsNotEmpty, IsNumber, IsOptional, IsIn } from 'class-validator';

export class RecordWinDto {
  @IsString()
  @IsNotEmpty()
  @IsIn(['copart', 'iaai'])
  auction: string;

  @IsString()
  @IsNotEmpty()
  lotNumber: string;

  @IsString()
  @IsOptional()
  vin?: string;

  @IsNumber()
  @IsNotEmpty()
  finalPrice: number;
}
