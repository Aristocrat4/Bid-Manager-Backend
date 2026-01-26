import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { SubUser, SubUserSchema } from '../../database/schemas/sub-user.schema';
import { Bid, BidSchema } from '../../database/schemas/bid.schema';
import { Win, WinSchema } from '../../database/schemas/win.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: SubUser.name, schema: SubUserSchema },
      { name: Bid.name, schema: BidSchema },
      { name: Win.name, schema: WinSchema },
    ]),
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class DashboardModule {}
