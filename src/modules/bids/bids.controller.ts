import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
} from '@nestjs/common';
import { BidsService } from './bids.service';
import { LogBidDto } from './dto/log-bid.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('bids')
@UseGuards(JwtAuthGuard)
export class BidsController {
  constructor(private readonly bidsService: BidsService) {}

  @Post('log')
  @HttpCode(HttpStatus.CREATED)
  async logBid(@Body() dto: LogBidDto, @Req() req: any) {
    // Extract userId and companyId from JWT token (attached by JwtAuthGuard)
    const userId = req.user.id;
    const companyId = req.user.companyId;

    await this.bidsService.logBid(userId, companyId, dto);

    return {
      success: true,
      message: 'Bid logged successfully',
    };
  }

  @Get()
  async findAll(
    @Req() req: any,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('userId') userId?: string,
    @Query('auction') auction?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const companyId = req.user.companyId;
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);

    return await this.bidsService.findByCompanyId(companyId, pageNum, limitNum);
  }

  @Get('user/:userId')
  async findByUser(
    @Param('userId') userId: string,
    @Query('page', new ParseIntPipe({ optional: true })) page: number = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit: number = 50,
  ) {
    return await this.bidsService.findByUserId(userId, page, limit);
  }

  @Get('company/:companyId')
  async findByCompany(
    @Param('companyId') companyId: string,
    @Query('page', new ParseIntPipe({ optional: true })) page: number = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit: number = 50,
  ) {
    return await this.bidsService.findByCompanyId(companyId, page, limit);
  }
}
