import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { WinsService } from './wins.service';
import { WinsController } from './wins.controller';
import { Win, WinSchema } from '../../database/schemas/win.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Win.name, schema: WinSchema }]),
  ],
  providers: [WinsService],
  controllers: [WinsController],
  exports: [WinsService],
})
export class WinsModule {}
