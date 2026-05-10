import { ExpressAdapter } from '@nestjs/platform-express'
import { NestFactory } from '@nestjs/core'
import express, { type Express } from 'express'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { AppModule } from '../src/app.module'
import { configureApp } from '../src/app.setup'

let serverPromise: Promise<Express> | undefined

async function createServer(): Promise<Express> {
  const expressServer = express()
  const app = await NestFactory.create(
    AppModule,
    new ExpressAdapter(expressServer),
  )

  configureApp(app)
  await app.init()

  return expressServer
}

export default async function handler(
  request: IncomingMessage,
  response: ServerResponse,
) {
  serverPromise ??= createServer()
  const server = await serverPromise

  server(request, response)
}
