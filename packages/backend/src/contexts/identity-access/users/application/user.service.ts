import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { User } from '../domain/user.entity';
import { IUserRepository, USER_REPOSITORY } from '../domain/user.repository';

const SALT_ROUNDS = 12;

@Injectable()
export class UserService {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
  ) {}

  async findAll(): Promise<User[]> {
    return this.userRepository.findAll();
  }

  async findById(id: string): Promise<User | null> {
    return this.userRepository.findById(id);
  }

  async create(data: {
    username: string;
    email: string;
    roleId: string;
    password: string;
  }): Promise<User> {
    const id = crypto.randomUUID();
    const password = await bcrypt.hash(data.password, SALT_ROUNDS);
    const user = new User(
      id,
      data.username.toLowerCase(),
      data.email,
      data.roleId,
      password,
    );
    return this.userRepository.save(user);
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.userRepository.findByUsername(username);
  }

  async verifyPassword(plainPassword: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, hash);
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
    confirmPassword: string,
  ): Promise<void> {
    if (newPassword !== confirmPassword) {
      throw new BadRequestException('Password confirmation does not match');
    }

    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isCurrentPasswordValid = await this.verifyPassword(
      currentPassword,
      user.password,
    );
    if (!isCurrentPasswordValid) {
      throw new UnauthorizedException('Current password is invalid');
    }

    const newPasswordHash = await this.createPasswordHash(newPassword);
    const updated = new User(
      user.id,
      user.username,
      user.email,
      user.roleId,
      newPasswordHash,
    );
    await this.userRepository.save(updated);
  }

  async updateEmail(userId: string, email: string): Promise<User | null> {
    const user = await this.userRepository.findById(userId);
    if (!user) return null;
    const updated = new User(
      user.id,
      user.username,
      email.trim(),
      user.roleId,
      user.password,
    );
    await this.userRepository.save(updated);
    return updated;
  }

  async delete(userId: string): Promise<void> {
    await this.userRepository.delete(userId);
  }

  private async createPasswordHash(password: string): Promise<string> {
    return bcrypt.hash(password, SALT_ROUNDS);
  }
}
