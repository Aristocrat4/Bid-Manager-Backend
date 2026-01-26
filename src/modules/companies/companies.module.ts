import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CompaniesService } from './companies.service';
import { CompaniesController } from './companies.controller';
import { Company, CompanySchema } from '../../database/schemas/company.schema';
import { EncryptionService } from '../../common/services/encryption.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Company.name, schema: CompanySchema }]),
  ],
  providers: [CompaniesService, EncryptionService],
  controllers: [CompaniesController],
  exports: [CompaniesService],
})
export class CompaniesModule {}
