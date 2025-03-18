import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Style } from './entities/style.entity';
import { StyleController } from './style.controller';
import { StyleService } from './style.service';

@Module({
  imports: [TypeOrmModule.forFeature([Style])],
  controllers: [StyleController],
  providers: [StyleService],
  exports: [StyleService],
})
export class StyleModule {}
