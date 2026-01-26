import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SubUser } from '../../../database/schemas/sub-user.schema';
import { Company } from '../../../database/schemas/company.schema';

export interface JwtPayload {
  sub: string; // User ID or Company ID
  username?: string;
  email?: string;
  companyId: string;
  type?: 'company' | 'user';
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    @InjectModel(SubUser.name) private readonly subUserModel: Model<SubUser>,
    @InjectModel(Company.name) private readonly companyModel: Model<Company>,
  ) {
    const secret = configService.get<string>('JWT_SECRET');
    if (!secret) {
      throw new Error('JWT_SECRET is not defined in environment variables');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: JwtPayload): Promise<any> {
    const { sub: id, type } = payload;

    // Handle company login
    if (type === 'company') {
      const company = await this.companyModel
        .findById(id)
        .select('-password -copartPassword -iaaiPassword')
        .lean()
        .exec();

      if (!company) {
        throw new UnauthorizedException('Company not found');
      }

      if (!company.isActive) {
        throw new UnauthorizedException('Company account is deactivated');
      }

      return {
        id: company._id.toString(),
        email: company.email,
        displayName: company.name,
        companyId: company._id.toString(),
        type: 'company',
      };
    }

    // Handle sub-user login
    const user = await this.subUserModel
      .findById(id)
      .select('-password')
      .lean()
      .exec();

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('User account is deactivated');
    }

    return {
      id: user._id.toString(),
      username: user.username,
      displayName: user.displayName,
      companyId: user.companyId.toString(),
      buyerNumber: user.buyerNumber,
      type: 'user',
    };
  }
}
