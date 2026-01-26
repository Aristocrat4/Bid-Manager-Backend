import { IsString, IsNotEmpty, MinLength } from 'class-validator';

export class CompanyLoginDto {
  @IsString()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;
}
