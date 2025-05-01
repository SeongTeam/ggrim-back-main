import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { TokenAuthGuard } from '../auth/guard/authentication/token-auth.guard';
import { RolesGuard } from '../auth/guard/authorization/roles.guard';
import { Roles } from '../user/decorator/role';
import { S3Service } from './s3.service';

@Controller('s3')
export class S3Controller {
  constructor(private readonly s3Service: S3Service) {}

  @Roles('admin')
  @UseGuards(TokenAuthGuard, RolesGuard)
  @Get(':bucket')
  async readFile(
    @Param('bucket') bucket: string,
    @Query('key') key: string,
    @Query('destination') destination: string,
  ) {
    await this.s3Service.downloadFile(bucket, key, destination);
  }
}
