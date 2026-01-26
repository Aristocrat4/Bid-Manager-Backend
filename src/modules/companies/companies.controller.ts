import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { CompaniesService } from './companies.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCredentialsDto } from './dto/update-credentials.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('companies')
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateCompanyDto) {
    const company = await this.companiesService.create(dto);
    return {
      success: true,
      data: company,
      message: 'Company registered successfully',
    };
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async findById(@Param('id') id: string) {
    const company = await this.companiesService.findById(id);
    return {
      success: true,
      data: company,
    };
  }

  @Get(':id/copart-credentials')
  @UseGuards(JwtAuthGuard)
  async getCopartCredentials(@Param('id') id: string) {
    const credentials = await this.companiesService.getCopartCredentials(id);
    return {
      success: true,
      data: credentials,
    };
  }

  @Get(':id/iaai-credentials')
  @UseGuards(JwtAuthGuard)
  async getIaaiCredentials(@Param('id') id: string) {
    const credentials = await this.companiesService.getIaaiCredentials(id);
    return {
      success: true,
      data: credentials,
    };
  }

  @Patch(':id/credentials')
  @UseGuards(JwtAuthGuard)
  async updateCredentials(
    @Param('id') id: string,
    @Body() dto: UpdateCredentialsDto,
  ) {
    const company = await this.companiesService.updateCredentials(id, dto);
    return {
      success: true,
      data: company,
      message: 'Credentials updated successfully',
    };
  }
}
