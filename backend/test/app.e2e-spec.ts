import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import type { Express } from 'express';
import request from 'supertest';
import { AppModule } from './../src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer() as Express)
      .get('/')
      .expect(200)
      .expect('Earnest Fintech Task API is running');
  });

  it('/health (GET)', async () => {
    const response = await request(app.getHttpServer() as Express)
      .get('/health')
      .expect(200);

    expect(response.body).toEqual(
      expect.objectContaining({
        status: 'ok',
        service: 'earnest-fintech-backend',
      }),
    );
  });
});
