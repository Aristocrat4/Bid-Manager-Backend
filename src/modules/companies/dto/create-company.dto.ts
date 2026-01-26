import { IsString, IsNotEmpty, MinLength, IsOptional, IsEmail } from 'class-validator';

export class CreateCompanyDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @IsString()
  @IsNotEmpty()
  copartUsername: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  copartPassword: string;

  @IsString()
  @IsOptional()
  iaaiUsername?: string;

  @IsString()
  @MinLength(6)
  @IsOptional()
  iaaiPassword?: string;
}
