import {
  Injectable,
  ConflictException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { Company } from '../../database/schemas/company.schema';
import { EncryptionService } from '../../common/services/encryption.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCredentialsDto } from './dto/update-credentials.dto';

export interface CompanyResponse {
  id: string;
  name: string;
  email: string;
  copartUsername: string;
  iaaiUsername?: string;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CompanyCredentials {
  username: string;
  password: string;
}

@Injectable()
export class CompaniesService {
  private readonly logger = new Logger(CompaniesService.name);

  constructor(
    @InjectModel(Company.name) private readonly companyModel: Model<Company>,
    private readonly encryptionService: EncryptionService,
  ) {}

  async create(dto: CreateCompanyDto): Promise<CompanyResponse> {
    this.logger.log(`Creating company: ${dto.name}`);

    // Check if company name already exists
    const existingCompany = await this.companyModel
      .findOne({ $or: [{ name: dto.name }, { email: dto.email }] })
      .exec();

    if (existingCompany) {
      this.logger.warn(`Company name or email already exists: ${dto.name}`);
      throw new ConflictException('Company name or email already exists');
    }

    // Hash password for company admin login
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    // Encrypt Copart password
    const encryptedCopartPassword = this.encryptionService.encrypt(
      dto.copartPassword,
    );

    // Encrypt IAAI password if provided
    let encryptedIaaiPassword: string | undefined;
    if (dto.iaaiPassword) {
      encryptedIaaiPassword = this.encryptionService.encrypt(dto.iaaiPassword);
    }

    // Create company
    const company = new this.companyModel({
      name: dto.name,
      email: dto.email,
      password: hashedPassword,
      copartUsername: dto.copartUsername,
      copartPassword: encryptedCopartPassword,
      iaaiUsername: dto.iaaiUsername,
      iaaiPassword: encryptedIaaiPassword,
      isActive: true,
    });

    const savedCompany = await company.save();

    this.logger.log(`Company created successfully: ${savedCompany.name}`);

    return {
      id: savedCompany._id.toString(),
      name: savedCompany.name,
      email: savedCompany.email,
      copartUsername: savedCompany.copartUsername,
      iaaiUsername: savedCompany.iaaiUsername,
      isActive: savedCompany.isActive,
      createdAt: savedCompany.createdAt,
      updatedAt: savedCompany.updatedAt,
    };
  }

  async findById(id: string): Promise<CompanyResponse> {
    const company = await this.companyModel.findById(id).lean().exec();

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    return {
      id: company._id.toString(),
      name: company.name,
      email: company.email,
      copartUsername: company.copartUsername,
      iaaiUsername: company.iaaiUsername,
      isActive: company.isActive,
      createdAt: company.createdAt,
      updatedAt: company.updatedAt,
    };
  }

  async findByEmail(email: string): Promise<Company | null> {
    return this.companyModel.findOne({ email }).exec();
  }

  async getCopartCredentials(companyId: string): Promise<CompanyCredentials> {
    this.logger.log(`Retrieving Copart credentials for company: ${companyId}`);

    const company = await this.companyModel.findById(companyId).exec();

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    // Decrypt password
    const decryptedPassword = this.encryptionService.decrypt(
      company.copartPassword,
    );

    return {
      username: company.copartUsername,
      password: decryptedPassword,
    };
  }

  async getIaaiCredentials(companyId: string): Promise<CompanyCredentials> {
    this.logger.log(`Retrieving IAAI credentials for company: ${companyId}`);

    const company = await this.companyModel.findById(companyId).exec();

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    if (!company.iaaiUsername || !company.iaaiPassword) {
      throw new NotFoundException('IAAI credentials not configured');
    }

    // Decrypt password
    const decryptedPassword = this.encryptionService.decrypt(
      company.iaaiPassword,
    );

    return {
      username: company.iaaiUsername,
      password: decryptedPassword,
    };
  }

  async updateCredentials(
    companyId: string,
    dto: UpdateCredentialsDto,
  ): Promise<CompanyResponse> {
    this.logger.log(`Updating credentials for company: ${companyId}`);

    const company = await this.companyModel.findById(companyId).exec();

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    // Update Copart credentials if provided
    if (dto.copartUsername !== undefined) {
      company.copartUsername = dto.copartUsername;
    }
    if (dto.copartPassword !== undefined) {
      company.copartPassword = this.encryptionService.encrypt(
        dto.copartPassword,
      );
    }

    // Update IAAI credentials if provided
    if (dto.iaaiUsername !== undefined) {
      company.iaaiUsername = dto.iaaiUsername;
    }
    if (dto.iaaiPassword !== undefined) {
      company.iaaiPassword = this.encryptionService.encrypt(dto.iaaiPassword);
    }

    const updatedCompany = await company.save();

    this.logger.log(`Credentials updated successfully for: ${updatedCompany.name}`);

    return {
      id: updatedCompany._id.toString(),
      name: updatedCompany.name,
      email: updatedCompany.email,
      copartUsername: updatedCompany.copartUsername,
      iaaiUsername: updatedCompany.iaaiUsername,
      isActive: updatedCompany.isActive,
      createdAt: updatedCompany.createdAt,
      updatedAt: updatedCompany.updatedAt,
    };
  }
}
