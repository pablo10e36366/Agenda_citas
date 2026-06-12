type Environment = 'development' | 'test' | 'production'

interface EnvironmentVariables {
  CORS_ORIGIN?: string
  DATABASE_URL: string
  JWT_EXPIRES_IN: number
  JWT_SECRET: string
  NODE_ENV: Environment
  PORT: number
}

const DEFAULT_PORT = 3000
const DEFAULT_JWT_EXPIRES_IN = 86400
const MIN_JWT_SECRET_LENGTH = 32

function readString(config: Record<string, unknown>, key: string): string {
  const value = config[key]

  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`Missing required environment variable: ${key}`)
  }

  return value.trim()
}

function readOptionalNumber(
  config: Record<string, unknown>,
  key: string,
  defaultValue: number,
): number {
  const value = config[key]

  if (value === undefined || value === null || value === '') {
    return defaultValue
  }

  const parsed = Number(value)

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${key} must be a positive integer`)
  }

  return parsed
}

function readOptionalString(
  config: Record<string, unknown>,
  key: string,
): string | undefined {
  const value = config[key]

  if (value === undefined || value === null || value === '') {
    return undefined
  }

  if (typeof value !== 'string') {
    throw new Error(`${key} must be a string`)
  }

  return value.trim()
}

function readNodeEnv(config: Record<string, unknown>): Environment {
  const value = config.NODE_ENV

  if (value === undefined || value === null || value === '') {
    return 'development'
  }

  if (value === 'development' || value === 'test' || value === 'production') {
    return value
  }

  throw new Error('NODE_ENV must be development, test, or production')
}

export function validateEnvironment(
  config: Record<string, unknown>,
): EnvironmentVariables {
  const databaseUrl = readString(config, 'DATABASE_URL')
  const jwtSecret = readString(config, 'JWT_SECRET')
  const port = readOptionalNumber(config, 'PORT', DEFAULT_PORT)
  const jwtExpiresIn = readOptionalNumber(
    config,
    'JWT_EXPIRES_IN',
    DEFAULT_JWT_EXPIRES_IN,
  )

  if (
    !databaseUrl.startsWith('postgresql://') &&
    !databaseUrl.startsWith('postgres://')
  ) {
    throw new Error('DATABASE_URL must be a PostgreSQL connection string')
  }

  if (
    jwtSecret === 'change-this-secret-in-production' ||
    jwtSecret.length < MIN_JWT_SECRET_LENGTH
  ) {
    throw new Error(
      `JWT_SECRET must be at least ${MIN_JWT_SECRET_LENGTH} characters and not use the default placeholder`,
    )
  }

  if (port > 65535) {
    throw new Error('PORT must be between 1 and 65535')
  }

  return {
    CORS_ORIGIN: readOptionalString(config, 'CORS_ORIGIN'),
    DATABASE_URL: databaseUrl,
    JWT_EXPIRES_IN: jwtExpiresIn,
    JWT_SECRET: jwtSecret,
    NODE_ENV: readNodeEnv(config),
    PORT: port,
  }
}
