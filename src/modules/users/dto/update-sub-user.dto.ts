import { IsString, IsBoolean, IsOptional } from 'class-validator';

export class UpdateSubUserDto {
  @IsString()
  @IsOptional()
  displayName?: string;

  @IsString()
  @IsOptional()
  buyerNumber?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
