import { Injectable } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, Strategy } from 'passport-jwt'
import { jwtConstants } from '../constants'
import { UserRole } from '../roles/role.enum'

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtConstants.secret,
    })
  }

  validate(payload: { sub: number; email: string; role: UserRole }) {
    return {
      userId: payload.sub,
      email: payload.email,
      role: payload.role,
    }
  }
}
