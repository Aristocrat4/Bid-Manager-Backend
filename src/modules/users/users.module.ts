import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { SubUser, SubUserSchema } from '../../database/schemas/sub-user.schema';
import { Win, WinSchema } from '../../database/schemas/win.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: SubUser.name, schema: SubUserSchema },
      { name: Win.name, schema: WinSchema },
    ]),
  ],
  providers: [UsersService],
  controllers: [UsersController],
  exports: [UsersService],
})
export class UsersModule {}
