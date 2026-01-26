import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from './modules/auth/auth.module';
import { CompaniesModule } from './modules/companies/companies.module';
import { UsersModule } from './modules/users/users.module';
import { BidsModule } from './modules/bids/bids.module';
import { WinsModule } from './modules/wins/wins.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';

@Module({
  imports: [
    // Global configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // MongoDB connection
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI'),
      }),
      inject: [ConfigService],
    }),

    // Feature modules
    AuthModule,
    CompaniesModule,
    UsersModule,
    BidsModule,
    WinsModule,
    DashboardModule,
  ],
})
export class AppModule {}
