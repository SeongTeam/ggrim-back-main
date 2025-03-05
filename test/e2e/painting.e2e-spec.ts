import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';

import * as request from 'supertest';
import { S3Service } from '../../src/aws/s3.service';
import { PaintingService } from '../../src/painting/painting.service';

describe('PaintingController (e2e)', () => {
  let app: INestApplication;
  let paintingService: PaintingService;
  let s3Service: S3Service;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    paintingService = moduleFixture.get<PaintingService>(PaintingService);
    s3Service = moduleFixture.get<S3Service>(S3Service);
  });

  describe('200: /painting (GET)', () => {
    it('기본 /painting/', async () => {
      const response = await request(app.getHttpServer())
        .get('/painting/')
        .query({
          page: 0,
        })
        .expect(200);

      expect(response.body.data).toBeDefined();
      expect(response.body.data.length).toBe(5);
    });
    it('tag로 그림 search', async () => {
      return request(app.getHttpServer())
        .get('/painting/')
        .query({
          'tags[]': ['Ballet dancer'], // []에 원소가 2개 이상이면  tags: [{원소1}, {원소2}] 사용 가능
        })
        .expect(200)
        .expect((res) => {
          // 응답 데이터에서 title 확인
          expect(res.body.data[0].title).toBe('The Ballet Class');
        });
    });

    it('200: title로 그림 search', async () => {
      return request(app.getHttpServer())
        .get('/painting/')
        .query({
          title: 'Bo',
        })
        .expect(200)
        .expect((res) => {
          // 응답 데이터에서 title 확인
          expect(res.body.data[0].title).toBe('Boy in a Red Vest');
          expect(res.body.data[1].title).toBe('Boulevard of Capucines');
        });
    });
  });
  describe('/painting/by-ids (GET)', () => {
    it('200: ID로 그림 조회 성공 및 title 확인', async () => {
      return request(app.getHttpServer())
        .get('/painting/by-ids')
        .query({
          ids: ['3772cae7-b6fd-4a6a-a02b-1b8513bc528f', 'a428de3c-46b9-4425-9e4a-628ffbecaaa3'], // []에 원소가 1개면  "ids[]"": [{원소1}] 사용 가능
        })
        .expect(200)
        .expect((res) => {
          // 응답 데이터에서 title 확인
          expect(res.body[0].title).toBe('The Ballet Class');
          expect(res.body[1].title).toBe('Boy in a Red Vest');
        });
    });
  });
});
