import { Controller, Get, Post, Param, UseGuards } from '@nestjs/common';
import { ScraperService } from './scraper.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('scraper')
export class ScraperController {
  constructor(private readonly scraperService: ScraperService) {}

  @Get('health')
  async getHealth() {
    return {
      status: 'ok',
      isRunning: this.scraperService.isRunning,
      lastRun: this.scraperService.lastRunTime,
      checksToday: await this.scraperService.getChecksToday(),
    };
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard)
  async getStats() {
    return this.scraperService.getStats();
  }

  @Post('check/:bidId')
  @UseGuards(JwtAuthGuard)
  async manualCheckBid(@Param('bidId') bidId: string) {
    await this.scraperService.manualCheckBid(bidId);
    return { message: 'Bid check initiated', bidId };
  }
}
