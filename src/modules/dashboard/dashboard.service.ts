import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SubUser } from '../../database/schemas/sub-user.schema';
import { Bid } from '../../database/schemas/bid.schema';
import { Win } from '../../database/schemas/win.schema';

export interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  bidsThisMonth: number;
  winsThisMonth: number;
  unbilledAmount: number;
  unbilledCount: number;
}

@Injectable()
export class DashboardService {
  constructor(
    @InjectModel(SubUser.name) private readonly subUserModel: Model<SubUser>,
    @InjectModel(Bid.name) private readonly bidModel: Model<Bid>,
    @InjectModel(Win.name) private readonly winModel: Model<Win>,
  ) {}

  async getCompanyStats(companyId: string): Promise<DashboardStats> {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [
      totalUsers,
      activeUsers,
      bidsThisMonth,
      winsThisMonth,
      unbilledWins,
    ] = await Promise.all([
      this.subUserModel.countDocuments({ companyId }).exec(),
      this.subUserModel.countDocuments({ companyId, isActive: true }).exec(),
      this.bidModel.countDocuments({
        companyId,
        createdAt: { $gte: startOfMonth },
      }).exec(),
      this.winModel.countDocuments({
        companyId,
        wonAt: { $gte: startOfMonth },
      }).exec(),
      this.winModel.find({ companyId, billed: false }).exec(),
    ]);

    const unbilledAmount = unbilledWins.reduce(
      (sum, win) => sum + win.feeCharged,
      0,
    );
    const unbilledCount = unbilledWins.length;

    return {
      totalUsers,
      activeUsers,
      bidsThisMonth,
      winsThisMonth,
      unbilledAmount,
      unbilledCount,
    };
  }
}
