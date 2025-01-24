import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { ClassSerializerInterceptor, RequestMethod, ValidationPipe } from '@nestjs/common';
import { Environment } from './core/enums/environment.enum';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { RequestInterceptor } from './core/interceptor/req.interceptor';

let app: NestExpressApplication;
let cachedRequestInterceptor: RequestInterceptor | null = null;

async function bootstrap() {
  if (!app) {
    app = await NestFactory.create<NestExpressApplication>(AppModule);
    app.enableCors();
    app.setGlobalPrefix('api', {
      exclude: [{ path: '/', method: RequestMethod.GET }],
    });


    // if (process.env.NODE_ENV === Environment.DEVELOPMENT) {
    const connectSrc = ["'self'"];
    connectSrc.push('*');
    const config = new DocumentBuilder()
      .setTitle('eLearning API Documentation')
      .setDescription('REST API for the eLearning')
      .setVersion('1.0')
      .addBearerAuth()
      .addTag('eLearning')
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api', app, document);
    // }

    if (!cachedRequestInterceptor) {
      cachedRequestInterceptor = app.get(RequestInterceptor);
    }

    app.enableVersioning();
    const requestInterceptor = app.get(RequestInterceptor);
    app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)), requestInterceptor);

    app.useGlobalPipes(new ValidationPipe());
  }
  return app;
}

// For Vercel serverless deployment
export default async function handler(req, res) {
  if (!app) {
    await bootstrap();
  }
  const expressApp = app.getHttpAdapter().getInstance();
  expressApp(req, res);
  console.log(`Request served in region: ${process.env.VERCEL_REGION}`);
}

// For local development
if (!process.env.VERCEL) {
  bootstrap().then((app) => {
    const port = parseInt(process.env.PORT, 10) || 4000;
    app.listen(port, () => {
      console.log(`Local server running at http://localhost:${port}`);
    });
  }).catch(console.log);
}
