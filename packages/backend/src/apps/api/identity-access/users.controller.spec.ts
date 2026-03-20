import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { UsersController } from './users.controller';
import { UserService } from '../../../contexts/identity-access/users/application/user.service';
import { User } from '../../../contexts/identity-access/users/domain/user.entity';

describe('UsersController', () => {
  let controller: UsersController;
  let userService: {
    findAll: jest.Mock;
    findById: jest.Mock;
    create: jest.Mock;
    changePassword: jest.Mock;
  };

  const mockUser = new User(
    'user-1',
    'admin',
    'admin@academic.local',
    'role-1',
    'hashed-password',
  );

  beforeEach(async () => {
    userService = {
      findAll: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      changePassword: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [{ provide: UserService, useValue: userService }],
    }).compile();

    controller = module.get<UsersController>(UsersController);
  });

  it('debería cambiar la contraseña del usuario autenticado', async () => {
    userService.changePassword.mockResolvedValue(undefined);

    const result = await controller.changeMyPassword(
      { user: { id: 'user-1' } } as never,
      {
        currentPassword: 'Actual123!',
        newPassword: 'Nueva123!',
        confirmPassword: 'Nueva123!',
      },
    );

    expect(userService.changePassword).toHaveBeenCalledWith(
      'user-1',
      'Actual123!',
      'Nueva123!',
      'Nueva123!',
    );
    expect(result).toEqual({ message: 'Password updated successfully' });
  });

  it('debería lanzar UnauthorizedException si no hay usuario autenticado', async () => {
    await expect(
      controller.changeMyPassword({} as never, {
        currentPassword: 'Actual123!',
        newPassword: 'Nueva123!',
        confirmPassword: 'Nueva123!',
      }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('debería propagar BadRequestException del servicio', async () => {
    userService.changePassword.mockRejectedValue(
      new BadRequestException('Password confirmation does not match'),
    );

    await expect(
      controller.changeMyPassword(
        { user: { id: 'user-1' } } as never,
        {
          currentPassword: 'Actual123!',
          newPassword: 'Nueva123!',
          confirmPassword: 'Otra123!',
        },
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('debería devolver lista de usuarios', async () => {
    userService.findAll.mockResolvedValue([mockUser]);

    const result = await controller.findAll();

    expect(result).toEqual([
      {
        id: 'user-1',
        username: 'admin',
        email: 'admin@academic.local',
        roleId: 'role-1',
      },
    ]);
  });

  it('debería devolver un usuario por id', async () => {
    userService.findById.mockResolvedValue(mockUser);

    const result = await controller.findOne('user-1');

    expect(result).toEqual({
      id: 'user-1',
      username: 'admin',
      email: 'admin@academic.local',
      roleId: 'role-1',
    });
  });

  it('debería lanzar NotFoundException si el usuario no existe', async () => {
    userService.findById.mockResolvedValue(null);

    await expect(controller.findOne('missing')).rejects.toThrow(
      NotFoundException,
    );
  });
});
