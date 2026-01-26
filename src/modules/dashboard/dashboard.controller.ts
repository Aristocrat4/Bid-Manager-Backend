import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats/:companyId')
  async getStats(@Param('companyId') companyId: string) {
    const stats = await this.dashboardService.getCompanyStats(companyId);

    return {
      success: true,
      data: stats,
      message: 'Dashboard statistics retrieved successfully',
    };
  }
}
