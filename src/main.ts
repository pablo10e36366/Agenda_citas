import { ConfigService } from '@nestjs/config'
import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { configureApp } from './app.setup'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  const configService = app.get(ConfigService)

  configureApp(app, configService.get<string>('CORS_ORIGIN'))
  app.enableShutdownHooks()

  await app.listen(configService.getOrThrow<number>('PORT'), '0.0.0.0')
}

bootstrap().catch((error: unknown) => {
  console.error(error)
  process.exit(1)
})
