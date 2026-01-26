import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { SubUser, SubUserSchema } from '../../database/schemas/sub-user.schema';
import { Company, CompanySchema } from '../../database/schemas/company.schema';

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const secret = configService.get<string>('JWT_SECRET');
        if (!secret) {
          throw new Error('JWT_SECRET is not defined in environment variables');
        }
        return {
          secret,
          signOptions: {
            expiresIn: configService.get('JWT_EXPIRATION') || '7d',
          },
        };
      },
      inject: [ConfigService],
    }),
    MongooseModule.forFeature([
      { name: SubUser.name, schema: SubUserSchema },
      { name: Company.name, schema: CompanySchema },
    ]),
  ],
  providers: [AuthService, JwtStrategy],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
