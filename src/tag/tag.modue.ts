import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { UserModule } from '../user/user.module';
import { Tag } from './entities/tag.entity';
import { TagController } from './tag.controller';
import { TagService } from './tag.service';

@Module({
  imports: [TypeOrmModule.forFeature([Tag]), AuthModule, UserModule],
  controllers: [TagController],
  providers: [TagService],
  exports: [TagService],
})
export class TagModule {}
