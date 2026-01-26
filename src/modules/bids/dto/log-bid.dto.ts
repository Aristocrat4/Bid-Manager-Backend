import { IsString, IsNotEmpty, IsNumber, IsOptional, IsDateString, IsIn } from 'class-validator';

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
}
