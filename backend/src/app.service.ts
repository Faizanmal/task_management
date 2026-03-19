import { Injectable } from '@nestjs/common';
@Injectable()
export class AppService {
  getHello(): string {
    return 'Earnest Fintech Task API is running';
  }

  getHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'earnest-fintech-backend',
    };
  }
}
