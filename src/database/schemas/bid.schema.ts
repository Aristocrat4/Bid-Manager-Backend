import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Bid extends Document {
  @Prop({ required: true, type: Types.ObjectId, ref: 'SubUser', index: true })
  userId: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, ref: 'Company', index: true })
  companyId: Types.ObjectId;

  @Prop({ required: true, enum: ['copart', 'iaai'] })
  auction: string;

  @Prop({ required: true, index: true })
  lotNumber: string;

  @Prop()
  vin?: string;

  @Prop({ required: true, type: Number })
  bidAmount: number;

  @Prop({ required: true })
  bidType: string; // e.g., "PreBid", "Live Bid", "Proxy Bid"

  @Prop({ type: Date })
  auctionDate?: Date;

  // NEW FIELDS FOR SCRAPER
  @Prop({ type: Date })
  auctionEndTime?: Date; // When auction ends (for scheduling checks)

  @Prop({ default: 'pending', enum: ['pending', 'active', 'won', 'lost', 'checking'] })
  status: string; // Bid status lifecycle

  @Prop({ default: false })
  isPreBid: boolean; // True if placed before auction starts

  @Prop({ type: Number })
  finalPrice?: number; // Actual winning price from auction

  @Prop({ type: Date })
  checkedAt?: Date; // Last time scraper checked this bid

  @Prop({ default: 0 })
  checkAttempts: number; // How many times we've tried to check

  @Prop()
  errorMessage?: string; // If scraper encounters error

  @Prop({ type: Object })
  vehicleInfo?: {
    year?: string;
    make?: string;
    model?: string;
    vin?: string;
  };

  createdAt?: Date;
  updatedAt?: Date;
}

export const BidSchema = SchemaFactory.createForClass(Bid);

// Indexes for efficient queries
BidSchema.index({ userId: 1, createdAt: -1 });
BidSchema.index({ companyId: 1, createdAt: -1 });
BidSchema.index({ lotNumber: 1, auction: 1 });
BidSchema.index({ createdAt: -1 });
// New indexes for scraper
BidSchema.index({ status: 1, auctionEndTime: 1 }); // For finding bids to check
BidSchema.index({ checkedAt: 1 }); // For scheduling
