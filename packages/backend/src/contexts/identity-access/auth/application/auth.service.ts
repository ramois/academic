import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User } from '../../users/domain/user.entity';
import { UserService } from '../../users/application/user.service';
import { RoleService } from '../../roles/application/role.service';
import type { JwtPayload } from '../infrastructure/jwt.payload';

export type LoginResult = {
  id: string;
  username: string;
  email: string;
  role: string;
};

export type LoginResponse = {
  access_token: string;
  user: LoginResult;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly roleService: RoleService,
    private readonly jwtService: JwtService,
  ) {}

  async login(username: string, password: string): Promise<LoginResponse> {
    const user = await this.userService.findByUsername(username);
    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }
    const valid = await this.userService.verifyPassword(password, user.password);
    if (!valid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }
    const loginResult = await this.toLoginResult(user);
    const payload: JwtPayload = {
      sub: user.id,
      username: user.username,
      role: loginResult.role,
    };
    const access_token = this.jwtService.sign(payload);
    return { access_token, user: loginResult };
  }

  private async toLoginResult(user: User): Promise<LoginResult> {
    const role = await this.roleService.findById(user.roleId);
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      role: role?.name ?? 'STUDENT',
    };
  }
}
