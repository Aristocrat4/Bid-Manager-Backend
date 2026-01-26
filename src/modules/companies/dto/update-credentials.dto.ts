import { IsString, IsOptional } from 'class-validator';

export class UpdateCredentialsDto {
  @IsString()
  @IsOptional()
  copartUsername?: string;

  @IsString()
  @IsOptional()
  copartPassword?: string;

  @IsString()
  @IsOptional()
  iaaiUsername?: string;

  @IsString()
  @IsOptional()
  iaaiPassword?: string;
}
