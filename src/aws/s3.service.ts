import { GetObjectCommand, GetObjectCommandOutput, S3Client } from '@aws-sdk/client-s3';
import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import { pipeline } from 'stream';
import { promisify } from 'util';
import { AWS_ACCESS_KEY, AWS_ACCESS_SECRET_KEY, AWS_REGION } from '../_common/const/env-keys.const';
import { ServiceException } from '../_common/filter/exception/service/service-exception';

@Injectable()
export class S3Service {
  private client: S3Client;

  constructor() {
    const accessKeyId = process.env[AWS_ACCESS_KEY] || 'access_key';
    const secretAccessKey = process.env[AWS_ACCESS_SECRET_KEY] || '';
    const region = process.env[AWS_REGION] || 'no-region';
    this.client = new S3Client({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });

    Logger.log(`accessKeyId : ${accessKeyId} , region : ${region}`);
  }

  async readObject(bucketName: string, path: string): Promise<string | undefined> {
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: path,
    });
    const { Body } = await this.client.send(command);
    return Body?.transformToString();
  }

  async downloadFile(bucketName: string, key: string, destinationPath: string): Promise<string> {
    const pipelineAsync = promisify(pipeline);
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: key,
    });
    const response: GetObjectCommandOutput = await this.client.send(command);

    if (!response.Body) {
      Logger.error(`download fail. ${JSON.stringify({ bucketName, key, destinationPath })}`);
      throw new ServiceException(
        'EXTERNAL_SERVICE_FAILED',
        'INTERNAL_SERVER_ERROR',
        'AWS S3 Client fail command.',
      );
    }

    await pipelineAsync(
      response.Body as NodeJS.ReadableStream,
      fs.createWriteStream(destinationPath),
    );
    return destinationPath;
  }
}
