import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from '../../../contexts/identity-access/auth/application/auth.service';
import { Public } from '../../../contexts/identity-access/auth/infrastructure/public.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  async login(
    @Body() body: { username: string; password: string },
  ) {
    return this.authService.login(
      body.username?.trim() ?? '',
      body.password ?? '',
    );
  }
}
