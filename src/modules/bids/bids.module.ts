import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BidsService } from './bids.service';
import { BidsController } from './bids.controller';
import { Bid, BidSchema } from '../../database/schemas/bid.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Bid.name, schema: BidSchema }]),
  ],
  providers: [BidsService],
  controllers: [BidsController],
  exports: [BidsService],
})
export class BidsModule {}
