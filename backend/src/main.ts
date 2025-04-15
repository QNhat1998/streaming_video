import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import * as cors from 'cors';
import { json, urlencoded } from 'express';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  // Enable CORS with detailed configuration
  app.use(
    cors({
      origin: process.env.CORS_ORIGIN?.split(','),
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
      allowedHeaders: ['Content-Type', 'Authorization', 'Range'],
      exposedHeaders: ['Content-Range', 'Content-Length', 'Accept-Ranges'],
      credentials: true,
      maxAge: 3600,
    }),
  );

  // Increase body size limit for video uploads
  app.use(json({ limit: '50mb' }));
  app.use(urlencoded({ extended: true, limit: '50mb' }));

  // Enable validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const port = process.env.PORT || 3001;
  const host = process.env.HOST || '0.0.0.0';

  try {
    await app.listen(port, host, () => {
      logger.log(`Server is running in ${process.env.NODE_ENV} mode`);
      logger.log(`Server is running on:`);
      logger.log(`- http://localhost:${port}`);
      logger.log(`- http://165.22.96.70:${port}`);
      logger.log(`CORS enabled for: ${process.env.CORS_ORIGIN}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

bootstrap().catch((error) => {
  console.error('Failed to bootstrap application:', error);
  process.exit(1);
});
