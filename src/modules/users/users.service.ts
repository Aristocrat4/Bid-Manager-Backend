import {
  Injectable,
  ConflictException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { SubUser } from '../../database/schemas/sub-user.schema';
import { Win } from '../../database/schemas/win.schema';
import { CreateSubUserDto } from './dto/create-sub-user.dto';
import { UpdateSubUserDto } from './dto/update-sub-user.dto';

export interface UserResponse {
  id: string;
  companyId: string;
  username: string;
  displayName: string;
  buyerNumber?: string;
  isActive: boolean;
  balance: number;
  createdAt?: Date;
  updatedAt?: Date;
}

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);
  private readonly SALT_ROUNDS = 10;

  constructor(
    @InjectModel(SubUser.name) private readonly subUserModel: Model<SubUser>,
    @InjectModel(Win.name) private readonly winModel: Model<Win>,
  ) {}

  async create(dto: CreateSubUserDto): Promise<UserResponse> {
    this.logger.log(`Creating sub-user: ${dto.username}`);

    // Check if username already exists
    const existingUser = await this.subUserModel
      .findOne({ username: dto.username })
      .exec();

    if (existingUser) {
      this.logger.warn(`Username already exists: ${dto.username}`);
      throw new ConflictException('Username already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(dto.password, this.SALT_ROUNDS);

    // Create user
    const user = new this.subUserModel({
      companyId: dto.companyId,
      username: dto.username,
      password: hashedPassword,
      displayName: dto.displayName,
      buyerNumber: dto.buyerNumber,
      isActive: true,
    });

    const savedUser = await user.save();

    this.logger.log(`Sub-user created successfully: ${savedUser.username}`);

    return {
      id: savedUser._id.toString(),
      companyId: savedUser.companyId.toString(),
      username: savedUser.username,
      displayName: savedUser.displayName,
      buyerNumber: savedUser.buyerNumber,
      isActive: savedUser.isActive,
      balance: 0,
      createdAt: savedUser.createdAt,
      updatedAt: savedUser.updatedAt,
    };
  }

  async findById(id: string): Promise<UserResponse> {
    const user = await this.subUserModel
      .findById(id)
      .select('-password')
      .lean()
      .exec();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Calculate balance from unbilled wins
    const unbilledWins = await this.winModel
      .find({ userId: id, billed: false })
      .lean()
      .exec();

    const balance = unbilledWins.reduce((sum, win) => sum + win.feeCharged, 0);

    return {
      id: user._id.toString(),
      companyId: user.companyId.toString(),
      username: user.username,
      displayName: user.displayName,
      buyerNumber: user.buyerNumber,
      isActive: user.isActive,
      balance,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  async findByCompanyId(companyId: string): Promise<UserResponse[]> {
    const users = await this.subUserModel
      .find({ companyId, isActive: true })
      .select('-password')
      .sort({ createdAt: -1 })
      .lean()
      .exec();

    // Get all unbilled wins for this company in one query
    const unbilledWins = await this.winModel
      .find({ companyId, billed: false })
      .lean()
      .exec();

    // Calculate balance per user
    const balanceByUserId = new Map<string, number>();
    for (const win of unbilledWins) {
      const userId = win.userId.toString();
      const currentBalance = balanceByUserId.get(userId) || 0;
      balanceByUserId.set(userId, currentBalance + win.feeCharged);
    }

    return users.map((user) => ({
      id: user._id.toString(),
      companyId: user.companyId.toString(),
      username: user.username,
      displayName: user.displayName,
      buyerNumber: user.buyerNumber,
      isActive: user.isActive,
      balance: balanceByUserId.get(user._id.toString()) || 0,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }));
  }

  async update(id: string, dto: UpdateSubUserDto): Promise<UserResponse> {
    this.logger.log(`Updating user: ${id}`);

    const user = await this.subUserModel.findById(id).exec();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (dto.displayName !== undefined) user.displayName = dto.displayName;
    if (dto.buyerNumber !== undefined) user.buyerNumber = dto.buyerNumber;
    if (dto.isActive !== undefined) user.isActive = dto.isActive;

    const updatedUser = await user.save();

    this.logger.log(`User updated successfully: ${updatedUser.username}`);

    // Calculate balance from unbilled wins
    const unbilledWins = await this.winModel
      .find({ userId: id, billed: false })
      .lean()
      .exec();

    const balance = unbilledWins.reduce((sum, win) => sum + win.feeCharged, 0);

    return {
      id: updatedUser._id.toString(),
      companyId: updatedUser.companyId.toString(),
      username: updatedUser.username,
      displayName: updatedUser.displayName,
      buyerNumber: updatedUser.buyerNumber,
      isActive: updatedUser.isActive,
      balance,
      createdAt: updatedUser.createdAt,
      updatedAt: updatedUser.updatedAt,
    };
  }

  async deactivate(id: string): Promise<void> {
    this.logger.log(`Deactivating user: ${id}`);

    const user = await this.subUserModel.findById(id).exec();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.isActive = false;
    await user.save();

    this.logger.log(`User deactivated successfully: ${user.username}`);
  }
}
