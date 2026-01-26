import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Win } from '../../database/schemas/win.schema';
import { RecordWinDto } from './dto/record-win.dto';

export interface WinResponse {
  id: string;
  userId: string;
  companyId: string;
  auction: string;
  lotNumber: string;
  vin?: string;
  finalPrice: number;
  feeCharged: number;
  billed: boolean;
  wonAt: Date;
  createdAt?: Date;
}

export interface PaginatedWinsResponse {
  success: boolean;
  data: WinResponse[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface UnbilledWinsResponse {
  success: boolean;
  data: {
    wins: WinResponse[];
    count: number;
    totalAmount: number;
  };
}

@Injectable()
export class WinsService {
  private readonly logger = new Logger(WinsService.name);
  private readonly DEFAULT_FEE = 10; // $10 per win for MVP

  constructor(
    @InjectModel(Win.name) private readonly winModel: Model<Win>,
  ) {}

  async recordWin(
    userId: string,
    companyId: string,
    dto: RecordWinDto,
  ): Promise<WinResponse> {
    this.logger.log(
      `Recording win for user ${userId}: Lot ${dto.lotNumber}, Price $${dto.finalPrice}`,
    );

    // Check if win already exists (prevent duplicates)
    const existingWin = await this.winModel
      .findOne({
        userId,
        lotNumber: dto.lotNumber,
        auction: dto.auction,
      })
      .exec();

    if (existingWin) {
      this.logger.warn(
        `Win already exists for lot ${dto.lotNumber}, returning existing`,
      );
      return this.mapWinToResponse(existingWin);
    }

    // Create new win
    const win = new this.winModel({
      userId,
      companyId,
      auction: dto.auction,
      lotNumber: dto.lotNumber,
      vin: dto.vin,
      finalPrice: dto.finalPrice,
      feeCharged: this.DEFAULT_FEE,
      billed: false,
      wonAt: new Date(),
    });

    const savedWin = await win.save();

    this.logger.log(
      `Win recorded successfully for lot ${dto.lotNumber} with fee $${this.DEFAULT_FEE}`,
    );

    return this.mapWinToResponse(savedWin);
  }

  async findByUserId(
    userId: string,
    page: number = 1,
    limit: number = 50,
  ): Promise<PaginatedWinsResponse> {
    const skip = (page - 1) * limit;

    const [wins, total] = await Promise.all([
      this.winModel
        .find({ userId })
        .sort({ wonAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      this.winModel.countDocuments({ userId }).exec(),
    ]);

    const winResponses: WinResponse[] = wins.map((win) =>
      this.mapWinToResponse(win),
    );

    return {
      success: true,
      data: winResponses,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findByCompanyId(
    companyId: string,
    page: number = 1,
    limit: number = 50,
  ): Promise<PaginatedWinsResponse> {
    const skip = (page - 1) * limit;

    const [wins, total] = await Promise.all([
      this.winModel
        .find({ companyId })
        .populate('userId', 'username displayName')
        .sort({ wonAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      this.winModel.countDocuments({ companyId }).exec(),
    ]);

    const winResponses: WinResponse[] = wins.map((win) =>
      this.mapWinToResponse(win),
    );

    return {
      success: true,
      data: winResponses,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getUnbilledWins(companyId: string): Promise<UnbilledWinsResponse> {
    this.logger.log(`Fetching unbilled wins for company ${companyId}`);

    const wins = await this.winModel
      .find({ companyId, billed: false })
      .populate('userId', 'username displayName')
      .sort({ wonAt: -1 })
      .lean()
      .exec();

    const winResponses: WinResponse[] = wins.map((win) =>
      this.mapWinToResponse(win),
    );

    const totalAmount = wins.reduce((sum, win) => sum + win.feeCharged, 0);

    this.logger.log(
      `Found ${wins.length} unbilled wins totaling $${totalAmount}`,
    );

    return {
      success: true,
      data: {
        wins: winResponses,
        count: wins.length,
        totalAmount,
      },
    };
  }

  private mapWinToResponse(win: any): WinResponse {
    return {
      id: win._id.toString(),
      userId: win.userId.toString(),
      companyId: win.companyId.toString(),
      auction: win.auction,
      lotNumber: win.lotNumber,
      vin: win.vin,
      finalPrice: win.finalPrice,
      feeCharged: win.feeCharged,
      billed: win.billed,
      wonAt: win.wonAt,
      createdAt: win.createdAt,
    };
  }
}
