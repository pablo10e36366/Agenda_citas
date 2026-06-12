import { INestApplication, ValidationPipe } from '@nestjs/common'

const localFrontendOrigins = ['http://localhost:5173', 'http://localhost:4173']

export function configureApp(
  app: INestApplication,
  corsOrigin?: string,
): INestApplication {
  app.enableCors({
    credentials: true,
    origin: resolveCorsOrigins(corsOrigin),
  })

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  )

  return app
}

function resolveCorsOrigins(corsOrigin?: string) {
  if (!corsOrigin) {
    return localFrontendOrigins
  }

  return corsOrigin
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)
}
