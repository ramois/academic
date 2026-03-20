import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { UserService } from './user.service';
import { USER_REPOSITORY } from '../domain/user.repository';
import { User } from '../domain/user.entity';

describe('UserService', () => {
  let service: UserService;
  let userRepository: {
    findAll: jest.Mock;
    findById: jest.Mock;
    findByUsername: jest.Mock;
    save: jest.Mock;
    delete: jest.Mock;
  };

  const existingUser = new User(
    'user-1',
    'admin',
    'admin@academic.local',
    'role-1',
    '$2b$12$GQ3Y2rK2c8Lk0sQ1OQ4pQ.6v6eM0d3g8g2.N6Jb5rH0IhY9f0YJmC',
  );

  beforeEach(async () => {
    userRepository = {
      findAll: jest.fn(),
      findById: jest.fn(),
      findByUsername: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: USER_REPOSITORY, useValue: userRepository },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
  });

  it('debería cambiar la contraseña cuando la actual es válida', async () => {
    const currentHash = await service['createPasswordHash']('Actual123!');
    userRepository.findById.mockResolvedValue({
      ...existingUser,
      password: currentHash,
    });
    userRepository.save.mockImplementation((user: User) =>
      Promise.resolve(user),
    );

    await service.changePassword(
      'user-1',
      'Actual123!',
      'Nueva123!',
      'Nueva123!',
    );

    expect(userRepository.save).toHaveBeenCalledTimes(1);
    const savedUser = userRepository.save.mock.calls[0][0] as User;
    expect(savedUser.id).toBe('user-1');
    expect(savedUser.password).not.toBe(currentHash);
    await expect(
      service.verifyPassword('Nueva123!', savedUser.password),
    ).resolves.toBe(true);
  });

  it('debería lanzar NotFoundException si el usuario no existe', async () => {
    userRepository.findById.mockResolvedValue(null);

    await expect(
      service.changePassword(
        'missing',
        'Actual123!',
        'Nueva123!',
        'Nueva123!',
      ),
    ).rejects.toThrow(NotFoundException);
  });

  it('debería lanzar UnauthorizedException si la contraseña actual no coincide', async () => {
    const currentHash = await service['createPasswordHash']('Otra123!');
    userRepository.findById.mockResolvedValue({
      ...existingUser,
      password: currentHash,
    });

    await expect(
      service.changePassword(
        'user-1',
        'Actual123!',
        'Nueva123!',
        'Nueva123!',
      ),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('debería lanzar BadRequestException si la confirmación no coincide', async () => {
    userRepository.findById.mockResolvedValue(existingUser);

    await expect(
      service.changePassword(
        'user-1',
        'Actual123!',
        'Nueva123!',
        'Distinta123!',
      ),
    ).rejects.toThrow(BadRequestException);
  });
});
