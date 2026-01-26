import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class SubUser extends Document {
  @Prop({ required: true, type: Types.ObjectId, ref: 'Company', index: true })
  companyId: Types.ObjectId;

  @Prop({ required: true, unique: true, index: true })
  username: string;

  @Prop({ required: true })
  password: string; // Hashed with bcrypt

  @Prop({ required: true })
  displayName: string;

  @Prop()
  buyerNumber?: string;

  @Prop({ default: true, index: true })
  isActive: boolean;

  createdAt?: Date;
  updatedAt?: Date;
}

export const SubUserSchema = SchemaFactory.createForClass(SubUser);

// Indexes
SubUserSchema.index({ companyId: 1, isActive: 1 });
SubUserSchema.index({ username: 1 }, { unique: true });
