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
import { WinsService } from './wins.service';
import { RecordWinDto } from './dto/record-win.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('wins')
@UseGuards(JwtAuthGuard)
export class WinsController {
  constructor(private readonly winsService: WinsService) {}

  @Post('record')
  @HttpCode(HttpStatus.CREATED)
  async recordWin(@Body() dto: RecordWinDto, @Req() req: any) {
    // Extract userId and companyId from JWT token (attached by JwtAuthGuard)
    const userId = req.user.id;
    const companyId = req.user.companyId;

    const win = await this.winsService.recordWin(userId, companyId, dto);

    return {
      success: true,
      data: win,
      message: 'Win recorded successfully',
    };
  }

  @Get()
  async findAll(
    @Req() req: any,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('userId') userId?: string,
    @Query('auction') auction?: string,
    @Query('billed') billed?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const companyId = req.user.companyId;
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);

    return await this.winsService.findByCompanyId(companyId, pageNum, limitNum);
  }

  @Get('user/:userId')
  async findByUser(
    @Param('userId') userId: string,
    @Query('page', new ParseIntPipe({ optional: true })) page: number = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit: number = 50,
  ) {
    return await this.winsService.findByUserId(userId, page, limit);
  }

  @Get('company/:companyId')
  async findByCompany(
    @Param('companyId') companyId: string,
    @Query('page', new ParseIntPipe({ optional: true })) page: number = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit: number = 50,
  ) {
    return await this.winsService.findByCompanyId(companyId, page, limit);
  }

  @Get('company/:companyId/unbilled')
  async getUnbilledWins(@Param('companyId') companyId: string) {
    return await this.winsService.getUnbilledWins(companyId);
  }
}
