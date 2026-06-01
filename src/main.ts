// eslint-disable-next-line @typescript-eslint/no-var-requires
require("dotenv").config();
import { RequestMethod } from "@nestjs/common";
import { HttpAdapterHost, NestFactory } from "@nestjs/core";
import type { NestExpressApplication } from "@nestjs/platform-express";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import * as compression from "compression";
import * as cookieParser from "cookie-parser";
import * as basicAuth from "express-basic-auth";
import helmet from "helmet";
import { join } from "path";
import { AppModule } from "./app.module";
import { appConfig } from "./config";
import { _AUTH_COOKIE_NAME_ } from "./constants";
import { GlobalExceptionFilter, HttpExceptionFilter } from "./modules";
import { GlobalHTTPInterceptor } from "./modules/global/interceptors/global-http.interceptor";

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.use(cookieParser(appConfig.COOKIE_SECRET, {}));
  app.use(
    helmet({
      // The admin dashboard pulls Tailwind/htmx/Alpine/Lucide from CDNs and
      // relies on inline config + Alpine expression evaluation, so relax CSP.
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: [
            "'self'",
            "'unsafe-inline'",
            "'unsafe-eval'",
            "https://cdn.tailwindcss.com",
            "https://unpkg.com",
            "https://cdn.jsdelivr.net",
          ],
          styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
          fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: ["'self'"],
        },
      },
    })
  );
  app.use(compression());

  app.enableCors({
    origin: appConfig.ALLOWED_ORIGINS?.split(", "),
    methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  });

  app.useStaticAssets(join(__dirname, "..", "public"));
  app.setBaseViewsDir(join(__dirname, "..", "views"));

  // Keep the API under /api but serve the server-rendered admin dashboard at
  // root (/admin, /admin/login, …).
  app.setGlobalPrefix("api", {
    exclude: [
      { path: "admin", method: RequestMethod.ALL },
      { path: "admin/(.*)", method: RequestMethod.ALL },
    ],
  });

  app.setViewEngine("pug");

  app.use(
    ["/documentation", "/docs", "/logs", "/logs/error.log"],
    basicAuth({
      challenge: true,
      users: { ["autopadi"]: appConfig.SWAGGER_PASSWORD },
    })
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle(`${appConfig.APP_NAME} Api`)
    .setDescription(`The ${appConfig.APP_NAME} API DOCUMENTATION`)
    .setVersion("1.0")
    .addServer(appConfig.APP_URL, "Server")
    .addTag(appConfig.APP_NAME)
    .addCookieAuth(_AUTH_COOKIE_NAME_)
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig, {
    ignoreGlobalPrefix: false,
  });

  SwaggerModule.setup("documentation", app, document, {
    customSiteTitle: `${appConfig.APP_NAME} App documentation`,
  });

  const httpAdapterHost = app.get(HttpAdapterHost);

  app.useGlobalInterceptors(new GlobalHTTPInterceptor());
  app.useGlobalFilters(
    new HttpExceptionFilter(),
    new GlobalExceptionFilter(httpAdapterHost)
  );
  await app.listen(appConfig.PORT);

  console.info(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();
