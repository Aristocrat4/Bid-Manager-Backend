import { IsString, IsNotEmpty, IsNumber, IsOptional, IsDateString, IsIn, IsBoolean, IsObject, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class VehicleInfoDto {
  @IsString()
  @IsOptional()
  year?: string;

  @IsString()
  @IsOptional()
  make?: string;

  @IsString()
  @IsOptional()
  model?: string;

  @IsString()
  @IsOptional()
  vin?: string;
}

export class LogBidDto {
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
  bidAmount: number;

  @IsString()
  @IsNotEmpty()
  bidType: string;

  @IsDateString()
  @IsOptional()
  auctionDate?: string;

  // NEW FIELDS FOR SCRAPER
  @IsDateString()
  @IsOptional()
  auctionEndTime?: string; // When auction ends

  @IsBoolean()
  @IsOptional()
  isPreBid?: boolean; // True if placed before auction starts

  @IsObject()
  @IsOptional()
  @ValidateNested()
  @Type(() => VehicleInfoDto)
  vehicleInfo?: VehicleInfoDto;
}
