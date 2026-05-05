export const jwtConstants = {
  secret: process.env.JWT_SECRET ?? 'change-this-secret-in-production',
  expiresIn: 86400,
}
