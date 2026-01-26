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

  createdAt?: Date;
  updatedAt?: Date;
}

export const BidSchema = SchemaFactory.createForClass(Bid);

// Indexes for efficient queries
BidSchema.index({ userId: 1, createdAt: -1 });
BidSchema.index({ companyId: 1, createdAt: -1 });
BidSchema.index({ lotNumber: 1, auction: 1 });
BidSchema.index({ createdAt: -1 });
