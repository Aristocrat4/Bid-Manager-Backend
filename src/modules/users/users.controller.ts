import {
  Controller,
  Post,
  Get,
  Delete,
  Patch,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateSubUserDto } from './dto/create-sub-user.dto';
import { UpdateSubUserDto } from './dto/update-sub-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // Public endpoint - allows company admins to create first user
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateSubUserDto) {
    const user = await this.usersService.create(dto);
    return {
      success: true,
      data: user,
      message: 'Sub-user created successfully',
    };
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async findAll(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Req() req: any,
  ) {
    const companyId = req.user.companyId;
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);

    const users = await this.usersService.findByCompanyId(companyId);
    const total = users.length;
    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = startIndex + limitNum;
    const paginatedUsers = users.slice(startIndex, endIndex);

    return {
      success: true,
      data: paginatedUsers,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    };
  }

  @Get('company/:companyId')
  @UseGuards(JwtAuthGuard)
  async findByCompany(@Param('companyId') companyId: string) {
    const users = await this.usersService.findByCompanyId(companyId);
    return {
      success: true,
      data: users,
    };
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async findById(@Param('id') id: string) {
    const user = await this.usersService.findById(id);
    return {
      success: true,
      data: user,
    };
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async update(@Param('id') id: string, @Body() dto: UpdateSubUserDto) {
    const user = await this.usersService.update(id, dto);
    return {
      success: true,
      data: user,
      message: 'User updated successfully',
    };
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async deactivate(@Param('id') id: string) {
    await this.usersService.deactivate(id);
    return {
      success: true,
      message: 'User deactivated successfully',
    };
  }
}
