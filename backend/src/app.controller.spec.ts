import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return API running message', () => {
      expect(appController.getHello()).toBe(
        'Earnest Fintech Task API is running',
      );
    });

    it('should return health payload', () => {
      expect(appController.getHealth()).toEqual(
        expect.objectContaining({
          status: 'ok',
          service: 'earnest-fintech-backend',
        }),
      );
    });
  });
});
