import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { RequestLoggingInterceptor } from './common/request-logging.interceptor';

type CorsOriginCallback = (err: Error | null, allow?: boolean) => void;

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const allowedOriginsFromEnv = new Set(
    (process.env.CORS_ALLOWED_ORIGINS ?? '')
      .split(',')
      .map((origin) => origin.trim())
      .filter((origin) => origin.length > 0),
  );

  const localhostOriginPattern =
    /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i;
  const privateNetworkOriginPattern =
    /^https?:\/\/(192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3})(:\d+)?$/i;

  app.enableCors({
    origin: (origin: string | undefined, callback: CorsOriginCallback) => {
      // Requests from native apps and tools may not send an Origin header.
      if (!origin) {
        callback(null, true);
        return;
      }

      if (
        localhostOriginPattern.test(origin) ||
        privateNetworkOriginPattern.test(origin) ||
        allowedOriginsFromEnv.has(origin)
      ) {
        callback(null, true);
        return;
      }

      callback(new Error(`CORS origin not allowed: ${origin}`), false);
    },
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  app.useGlobalInterceptors(new RequestLoggingInterceptor());

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Earnest Fintech Task API')
    .setDescription('Task management API with auth, reminders, and recurrence')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, swaggerDocument);

  await app.listen(process.env.PORT ?? 3001);
  console.log(`Server is running on port ${process.env.PORT ?? 3001}`);
}
void bootstrap();
