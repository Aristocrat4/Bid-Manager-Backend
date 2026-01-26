import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Company extends Document {
  @Prop({ required: true, unique: true, index: true })
  name: string;

  @Prop({ required: true, unique: true, index: true })
  email: string;

  @Prop({ required: true })
  password: string; // Hashed with bcrypt for company admin login

  @Prop({ required: true })
  copartUsername: string;

  @Prop({ required: true })
  copartPassword: string; // Encrypted with AES-256-GCM

  @Prop()
  iaaiUsername?: string;

  @Prop()
  iaaiPassword?: string; // Encrypted with AES-256-GCM

  @Prop({ default: true, index: true })
  isActive: boolean;

  createdAt?: Date;
  updatedAt?: Date;
}

export const CompanySchema = SchemaFactory.createForClass(Company);

// Indexes
CompanySchema.index({ name: 1 }, { unique: true });
CompanySchema.index({ email: 1 }, { unique: true });
CompanySchema.index({ isActive: 1 });
