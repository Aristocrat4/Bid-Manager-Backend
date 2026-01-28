import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';
import { ScraperService } from './scraper.service';
import { CopartScraperService } from './copart-scraper.service';
import { ScraperController } from './scraper.controller';
import { Bid, BidSchema } from '../../database/schemas/bid.schema';
import { Company, CompanySchema } from '../../database/schemas/company.schema';
import { EncryptionService } from '../../common/services/encryption.service';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    MongooseModule.forFeature([
      { name: Bid.name, schema: BidSchema },
      { name: Company.name, schema: CompanySchema },
    ]),
  ],
  controllers: [ScraperController],
  providers: [ScraperService, CopartScraperService, EncryptionService],
  exports: [ScraperService],
})
export class ScraperModule {}
