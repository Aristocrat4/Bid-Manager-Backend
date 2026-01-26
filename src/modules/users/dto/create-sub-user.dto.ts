import { IsString, IsNotEmpty, MinLength, IsMongoId, IsOptional } from 'class-validator';

export class CreateSubUserDto {
  @IsMongoId()
  @IsNotEmpty()
  companyId: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  username: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @IsString()
  @IsNotEmpty()
  displayName: string;

  @IsString()
  @IsOptional()
  buyerNumber?: string;
}
