import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Win extends Document {
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
  finalPrice: number;

  @Prop({ required: true, type: Number, default: 10 })
  feeCharged: number; // $10 per win for MVP

  @Prop({ default: false, index: true })
  billed: boolean;

  @Prop({ type: Types.ObjectId, ref: 'Invoice' })
  invoiceId?: Types.ObjectId;

  @Prop({ required: true, type: Date, default: Date.now })
  wonAt: Date;

  createdAt?: Date;
  updatedAt?: Date;
}

export const WinSchema = SchemaFactory.createForClass(Win);

// Indexes for efficient queries
WinSchema.index({ userId: 1, createdAt: -1 });
WinSchema.index({ companyId: 1, billed: 1 });
WinSchema.index({ lotNumber: 1, auction: 1 });
WinSchema.index({ wonAt: -1 });
WinSchema.index({ billed: 1, companyId: 1 });
