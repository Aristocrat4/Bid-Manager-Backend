import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Cron, CronExpression } from '@nestjs/schedule';
import { CopartScraperService } from './copart-scraper.service';
import { Bid } from '../../database/schemas/bid.schema';
import { Company } from '../../database/schemas/company.schema';
import { EncryptionService } from '../../common/services/encryption.service';

@Injectable()
export class ScraperService {
  private readonly logger = new Logger(ScraperService.name);
  public isRunning = false;
  public lastRunTime: Date | null = null;

  constructor(
    @InjectModel(Bid.name) private bidModel: Model<Bid>,
    @InjectModel(Company.name) private companyModel: Model<Company>,
    private copartScraper: CopartScraperService,
    private encryptionService: EncryptionService,
  ) {}

  // Run every 15 minutes
  @Cron(CronExpression.EVERY_10_MINUTES)
  async checkPendingBids() {
    if (this.isRunning) {
      this.logger.warn('Scraper already running, skipping this cycle');
      return;
    }

    this.isRunning = true;
    this.lastRunTime = new Date();

    try {
      this.logger.log('🔍 Starting automatic bid checking...');

      // Find bids that need checking
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      const oneDayFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      const bidsToCheck = await this.bidModel.find({
        status: { $in: ['pending', 'active'] },
        auctionEndTime: {
          $gte: oneHourAgo,
          $lte: oneDayFromNow,
        },
        // Don't check too frequently
        $or: [
          { checkedAt: { $exists: false } },
          { checkedAt: { $lte: new Date(now.getTime() - 10 * 60 * 1000) } }, // 10 min ago
        ],
      }).limit(50); // Process max 50 bids per run

      this.logger.log(`📊 Found ${bidsToCheck.length} bids to check`);

      if (bidsToCheck.length === 0) {
        this.logger.log('✅ No bids to check at this time');
        return;
      }

      for (const bid of bidsToCheck) {
        await this.checkSingleBid(bid);

        // Delay between checks to avoid rate limiting
        await this.delay(5000, 10000);
      }

      this.logger.log('✅ Automatic bid checking completed');
    } catch (error) {
      this.logger.error('❌ Error in automatic bid checking:', error);
    } finally {
      this.isRunning = false;
    }
  }

  async checkSingleBid(bid: any) {
    try {
      this.logger.log(`🔎 Checking bid for lot #${bid.lotNumber}`);

      // Update check timestamp
      bid.checkedAt = new Date();
      bid.checkAttempts += 1;
      bid.status = 'checking';
      await bid.save();

      // Get company credentials
      const company = await this.companyModel.findById(bid.companyId);

      if (!company) {
        throw new Error('Company not found');
      }

      if (!company.enableAutoChecking) {
        this.logger.log(`⏸️  Auto-checking disabled for company ${company.name}`);
        bid.status = 'pending';
        await bid.save();
        return;
      }

      if (!company.copartUsername || !company.copartPassword) {
        throw new Error('Copart credentials not set for company');
      }

      // Decrypt password
      const copartPassword = this.encryptionService.decrypt(
        company.copartPassword
      );

      // Login to Copart
      const page = await this.copartScraper.loginToCopart(
        company.copartUsername,
        copartPassword
      );

      // Check lot status
      const status = await this.copartScraper.checkLotStatus(
        page,
        bid.lotNumber,
        bid.bidAmount
      );

      // Close page
      await page.close();

      // Update bid based on status
      if (status.auctionEnded) {
        bid.status = status.status === 'won' ? 'won' : 'lost';
        bid.finalPrice = status.finalPrice;

        this.logger.log(
          `${bid.status === 'won' ? '🎉' : '❌'} Lot #${bid.lotNumber}: ${bid.status.toUpperCase()}` +
          (bid.finalPrice ? ` at $${bid.finalPrice}` : '')
        );

        // Send notification if won
        if (bid.status === 'won') {
          await this.notifyUserOfWin(company, bid);
        }
      } else {
        bid.status = 'active'; // Auction still ongoing
        this.logger.log(`⏳ Lot #${bid.lotNumber}: Still active`);
      }

      bid.errorMessage = undefined;
      await bid.save();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`❌ Error checking bid ${bid._id}:`, errorMessage);

      // Update bid with error
      bid.status = 'pending'; // Reset to pending to retry later
      bid.errorMessage = errorMessage;
      await bid.save();

      // If too many failures, give up
      if (bid.checkAttempts > 5) {
        bid.status = 'lost'; // Assume lost after 5 failed attempts
        bid.errorMessage = 'Max check attempts exceeded';
        await bid.save();
        this.logger.error(`⚠️  Lot #${bid.lotNumber}: Exceeded max retries`);
      }
    }
  }

  private async notifyUserOfWin(company: any, bid: any) {
    // TODO: Implement notification system
    // Options: Email, push notification, webhook, etc.

    this.logger.log(
      `🎉 WIN NOTIFICATION: ${company.name} won lot #${bid.lotNumber} ` +
      `for $${bid.finalPrice || bid.bidAmount}`
    );

    // For now, just log. Later can add:
    // - Email via SendGrid/Mailgun
    // - SMS via Twilio
    // - Push notification via Firebase
    // - Webhook to external service
  }

  private async delay(min: number, max: number): Promise<void> {
    const ms = Math.floor(Math.random() * (max - min + 1)) + min;
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // Manual check endpoint (can be called from API)
  async manualCheckBid(bidId: string): Promise<void> {
    const bid = await this.bidModel.findById(bidId);
    if (!bid) {
      throw new Error('Bid not found');
    }

    await this.checkSingleBid(bid);
  }

  async getChecksToday(): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return this.bidModel.countDocuments({
      checkedAt: { $gte: today },
    });
  }

  async getStats() {
    const [totalBids, pendingBids, wonBids, lostBids, activeBids, errorBids] = await Promise.all([
      this.bidModel.countDocuments(),
      this.bidModel.countDocuments({ status: 'pending' }),
      this.bidModel.countDocuments({ status: 'won' }),
      this.bidModel.countDocuments({ status: 'lost' }),
      this.bidModel.countDocuments({ status: 'active' }),
      this.bidModel.countDocuments({
        errorMessage: { $exists: true, $ne: null }
      }),
    ]);

    return {
      totalBids,
      pendingBids,
      wonBids,
      lostBids,
      activeBids,
      errorBids,
      lastRun: this.lastRunTime,
      isRunning: this.isRunning,
    };
  }
}
