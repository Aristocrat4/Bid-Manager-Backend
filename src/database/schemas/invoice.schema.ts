import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Invoice extends Document {
  @Prop({ required: true, type: Types.ObjectId, ref: 'Company', index: true })
  companyId: Types.ObjectId;

  @Prop({ required: true, unique: true, index: true })
  invoiceNumber: string;

  @Prop({ required: true, type: Number })
  totalAmount: number;

  @Prop({ required: true, type: Number })
  winsCount: number;

  @Prop({ required: true, type: [{ type: Types.ObjectId, ref: 'Win' }] })
  wins: Types.ObjectId[];

  @Prop({ required: true, type: Date })
  periodStart: Date;

  @Prop({ required: true, type: Date })
  periodEnd: Date;

  @Prop({ default: false, index: true })
  paid: boolean;

  @Prop({ type: Date })
  paidAt?: Date;

  createdAt?: Date;
  updatedAt?: Date;
}

export const InvoiceSchema = SchemaFactory.createForClass(Invoice);

// Indexes
InvoiceSchema.index({ companyId: 1, createdAt: -1 });
InvoiceSchema.index({ invoiceNumber: 1 }, { unique: true });
InvoiceSchema.index({ paid: 1 });
