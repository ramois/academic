import {
  BadRequestException,
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  NotFoundException,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { User } from '../../../contexts/identity-access/users/domain/user.entity';
import { UserService } from '../../../contexts/identity-access/users/application/user.service';
import { ChangePasswordDto } from './dto/change-password.dto';

function toUserResponse(user: User) {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    roleId: user.roleId,
  };
}

type AuthenticatedRequest = Request & {
  user?: {
    id: string;
  };
};

@Controller('users')
export class UsersController {
  constructor(private readonly userService: UserService) {}

  @Get()
  async findAll() {
    const users = await this.userService.findAll();
    return users.map(toUserResponse);
  }

  @Get('me')
  async findCurrentUser(@Req() req: AuthenticatedRequest) {
    const userId = req.user?.id;
    if (!userId) {
      throw new UnauthorizedException('No autorizado');
    }

    const user = await this.userService.findById(userId);
    if (!user) {
      throw new NotFoundException('Usario no encontrado');
    }

    return toUserResponse(user);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const user = await this.userService.findById(id);
    if (!user) throw new NotFoundException('User not found');
    return toUserResponse(user);
  }

  @Post()
  async create(
    @Body() body: {
      username: string;
      email: string;
      roleId: string;
      password: string;
    },
  ) {
    const user = await this.userService.create(body);
    return toUserResponse(user);
  }

  @Patch('me')
  async changeMyPassword(
    @Req() req: AuthenticatedRequest,
    @Body() body: ChangePasswordDto,
  ) {
    const userId = req.user?.id;
    if (!userId) {
      throw new UnauthorizedException('No autorizado');
    }

    if (body.newPassword !== body.confirmPassword) {
      throw new BadRequestException('Password confirmation does not match');
    }

    await this.userService.changePassword(
      userId,
      body.currentPassword,
      body.newPassword,
      body.confirmPassword,
    );

    return { message: 'Password updated successfully' };
  }
}
