import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Bid } from '../../database/schemas/bid.schema';
import { LogBidDto } from './dto/log-bid.dto';

export interface BidResponse {
  id: string;
  userId: string;
  companyId: string;
  auction: string;
  lotNumber: string;
  vin?: string;
  bidAmount: number;
  bidType: string;
  auctionDate?: Date;
  createdAt?: Date;
}

export interface PaginatedBidsResponse {
  success: boolean;
  data: BidResponse[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

@Injectable()
export class BidsService {
  private readonly logger = new Logger(BidsService.name);

  constructor(
    @InjectModel(Bid.name) private readonly bidModel: Model<Bid>,
  ) {}

  async logBid(
    userId: string,
    companyId: string,
    dto: LogBidDto,
  ): Promise<void> {
    this.logger.log(
      `Logging bid for user ${userId}: Lot ${dto.lotNumber}, Amount $${dto.bidAmount}`,
    );

    const bid = new this.bidModel({
      userId,
      companyId,
      auction: dto.auction,
      lotNumber: dto.lotNumber,
      vin: dto.vin,
      bidAmount: dto.bidAmount,
      bidType: dto.bidType,
      auctionDate: dto.auctionDate ? new Date(dto.auctionDate) : undefined,
    });

    await bid.save();

    this.logger.log(`Bid logged successfully for lot ${dto.lotNumber}`);
  }

  async findByUserId(
    userId: string,
    page: number = 1,
    limit: number = 50,
  ): Promise<PaginatedBidsResponse> {
    const skip = (page - 1) * limit;

    const [bids, total] = await Promise.all([
      this.bidModel
        .find({ userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      this.bidModel.countDocuments({ userId }).exec(),
    ]);

    const bidResponses: BidResponse[] = bids.map((bid) => ({
      id: bid._id.toString(),
      userId: bid.userId.toString(),
      companyId: bid.companyId.toString(),
      auction: bid.auction,
      lotNumber: bid.lotNumber,
      vin: bid.vin,
      bidAmount: bid.bidAmount,
      bidType: bid.bidType,
      auctionDate: bid.auctionDate,
      createdAt: bid.createdAt,
    }));

    return {
      success: true,
      data: bidResponses,
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
  ): Promise<PaginatedBidsResponse> {
    const skip = (page - 1) * limit;

    const [bids, total] = await Promise.all([
      this.bidModel
        .find({ companyId })
        .populate('userId', 'username displayName')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      this.bidModel.countDocuments({ companyId }).exec(),
    ]);

    const bidResponses: BidResponse[] = bids.map((bid) => ({
      id: bid._id.toString(),
      userId: bid.userId.toString(),
      companyId: bid.companyId.toString(),
      auction: bid.auction,
      lotNumber: bid.lotNumber,
      vin: bid.vin,
      bidAmount: bid.bidAmount,
      bidType: bid.bidType,
      auctionDate: bid.auctionDate,
      createdAt: bid.createdAt,
    }));

    return {
      success: true,
      data: bidResponses,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
