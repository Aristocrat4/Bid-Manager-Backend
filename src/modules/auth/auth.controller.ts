import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService, LoginResponse } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { CompanyLoginDto } from './dto/company-login.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto): Promise<LoginResponse> {
    return await this.authService.login(loginDto);
  }

  @Post('company/login')
  @HttpCode(HttpStatus.OK)
  async companyLogin(@Body() loginDto: CompanyLoginDto): Promise<LoginResponse> {
    return await this.authService.companyLogin(loginDto);
  }
}
