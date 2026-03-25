import { Body, Controller, Post, Req, Res } from '@nestjs/common';
import type { CookieOptions, Request, Response } from 'express';
import { AuthService } from '../../../contexts/identity-access/auth/application/auth.service';
import { Public } from '../../../contexts/identity-access/auth/infrastructure/public.decorator';

const JWT_COOKIE_NAME = process.env.JWT_COOKIE_NAME ?? 'access_token';
const COOKIE_DOMAIN = process.env.COOKIE_DOMAIN ?? undefined;
const COOKIE_SAMESITE = process.env.COOKIE_SAMESITE ?? 'lax';
const COOKIE_SECURE_ENV = process.env.COOKIE_SECURE ?? undefined;

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  // throttle más agresivo configurado desde ThrottlerModule con key 'auth'
  @Post('login')
  async login(
    @Body() body: { username: string; password: string },
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(
      body.username?.trim() ?? '',
      body.password ?? '',
    );

    const cookieSameSite =
      COOKIE_SAMESITE === 'strict' || COOKIE_SAMESITE === 'lax' || COOKIE_SAMESITE === 'none'
        ? COOKIE_SAMESITE
        : 'lax';

    const cookieSecureByEnv =
      COOKIE_SECURE_ENV === 'true' ? true : COOKIE_SECURE_ENV === 'false' ? false : undefined;

    // Reglas:
    // - Si SameSite=None => Secure debe ser true.
    // - Si no SameSite=None => usa req.secure (real detrás de proxy) o lo que indique COOKIE_SECURE.
    const cookieSecure =
      cookieSecureByEnv ??
      (cookieSameSite === 'none' ? true : req.secure);

    const cookieOptions: CookieOptions = {
      httpOnly: true,
      secure: cookieSecure,
      sameSite: cookieSameSite,
      path: '/',
      maxAge: 2 * 60 * 60 * 1000, // 2h (match with JWT signOptions)
    };
    if (COOKIE_DOMAIN) cookieOptions.domain = COOKIE_DOMAIN;

    res.cookie(JWT_COOKIE_NAME, result.access_token, cookieOptions);

    return result;
  }
}
