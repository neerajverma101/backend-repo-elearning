import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { ClassSerializerInterceptor, RequestMethod, ValidationPipe } from '@nestjs/common';
import { Environment } from './core/enums/environment.enum';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { RequestInterceptor } from './core/interceptor/req.interceptor';

let app: NestExpressApplication;

async function bootstrap() {
  if (!app) {
    app = await NestFactory.create<NestExpressApplication>(AppModule);
    app.enableCors();
    app.setGlobalPrefix('api', {
      exclude: [{ path: '/', method: RequestMethod.GET }],
    });

    let connectSrc = ["'self'"];

    if (process.env.NODE_ENV === Environment.DEVELOPMENT) {
      connectSrc.push('*');
      app.enableCors();
      const config = new DocumentBuilder()
        .setTitle('eLearning API Documentation')
        .setDescription('REST API for the eLearning')
        .setVersion('1.0')
        .addBearerAuth()
        .addTag('eLearning')
        .build();
      const document = SwaggerModule.createDocument(app, config);
      SwaggerModule.setup('api', app, document);
    }

    app.enableVersioning();
    const requestInterceptor = app.get(RequestInterceptor);
    app.useGlobalInterceptors(
      new ClassSerializerInterceptor(app.get(Reflector)),
      requestInterceptor,
    );

    app.useGlobalPipes(new ValidationPipe());

    return app;
  }

  return app;
}

// For Vercel serverless deployment
export default async function handler(req, res) {
  const app = await bootstrap();
  const expressApp = app.getHttpAdapter().getInstance();
  expressApp(req, res);
}

// For local development
if (process.env.NODE_ENV !== 'production') {
  bootstrap().then((app) => {
    const port = parseInt(process.env.PORT, 10) || 4000;
    app.listen(port, () => {
      console.log(`server running on http://localhost:${port}`);
    });
  });
}
