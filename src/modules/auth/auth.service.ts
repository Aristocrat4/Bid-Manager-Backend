import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { SubUser } from '../../database/schemas/sub-user.schema';
import { Company } from '../../database/schemas/company.schema';
import { LoginDto } from './dto/login.dto';
import { CompanyLoginDto } from './dto/company-login.dto';

export interface LoginResponse {
  success: boolean;
  data: {
    accessToken: string;
    user: {
      id: string;
      username: string;
      displayName: string;
      companyId: string;
      buyerNumber?: string;
    };
  };
  message?: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectModel(SubUser.name) private readonly subUserModel: Model<SubUser>,
    @InjectModel(Company.name) private readonly companyModel: Model<Company>,
    private readonly jwtService: JwtService,
  ) {}

  async login(loginDto: LoginDto): Promise<LoginResponse> {
    const { username, password } = loginDto;

    this.logger.log(`Login attempt for username: ${username}`);

    // Find user by username
    const user = await this.subUserModel.findOne({ username }).exec();

    if (!user) {
      this.logger.warn(`Login failed: User not found - ${username}`);
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if user is active
    if (!user.isActive) {
      this.logger.warn(`Login failed: User deactivated - ${username}`);
      throw new UnauthorizedException('User account is deactivated');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      this.logger.warn(`Login failed: Invalid password - ${username}`);
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate JWT token
    const payload = {
      sub: user._id.toString(),
      username: user.username,
      companyId: user.companyId.toString(),
    };

    const accessToken = this.jwtService.sign(payload);

    this.logger.log(`Login successful for username: ${username}`);

    return {
      success: true,
      data: {
        accessToken,
        user: {
          id: user._id.toString(),
          username: user.username,
          displayName: user.displayName,
          companyId: user.companyId.toString(),
          buyerNumber: user.buyerNumber,
        },
      },
      message: 'Login successful',
    };
  }

  async companyLogin(loginDto: CompanyLoginDto): Promise<LoginResponse> {
    const { email, password } = loginDto;

    this.logger.log(`Company login attempt for email: ${email}`);

    // Find company by email
    const company = await this.companyModel.findOne({ email }).exec();

    if (!company) {
      this.logger.warn(`Company login failed: Company not found - ${email}`);
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if company is active
    if (!company.isActive) {
      this.logger.warn(`Company login failed: Company deactivated - ${email}`);
      throw new UnauthorizedException('Company account is deactivated');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, company.password);
    if (!isPasswordValid) {
      this.logger.warn(`Company login failed: Invalid password - ${email}`);
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate JWT token with company info
    const payload = {
      sub: company._id.toString(),
      email: company.email,
      companyId: company._id.toString(),
      type: 'company', // Distinguish from sub-user tokens
    };

    const accessToken = this.jwtService.sign(payload);

    this.logger.log(`Company login successful for email: ${email}`);

    return {
      success: true,
      data: {
        accessToken,
        user: {
          id: company._id.toString(),
          username: company.email, // Use email as username
          displayName: company.name, // Use company name
          companyId: company._id.toString(),
        },
      },
      message: 'Company login successful',
    };
  }

  async validateUser(userId: string): Promise<any> {
    const user = await this.subUserModel
      .findById(userId)
      .select('-password')
      .lean()
      .exec();

    if (!user || !user.isActive) {
      return null;
    }

    return {
      id: user._id.toString(),
      username: user.username,
      displayName: user.displayName,
      companyId: user.companyId.toString(),
      buyerNumber: user.buyerNumber,
    };
  }
}
