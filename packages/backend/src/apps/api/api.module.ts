import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { IdentityAccessModule } from '../../contexts/identity-access/identity-access.module';
import { AcademicModule } from '../../contexts/academic/academic.module';
import { JwtAuthGuard } from '../../contexts/identity-access/auth/infrastructure/jwt-auth.guard';
import { UsersController } from './identity-access/users.controller';
import { AuthController } from './identity-access/auth.controller';
import { RolesController } from './identity-access/roles.controller';
import { StudentsController } from './academic/students.controller';
import { SchedulesController } from './academic/schedules.controller';
import { CoursesController } from './academic/courses.controller';

@Module({
  imports: [IdentityAccessModule, AcademicModule],
  controllers: [
    UsersController,
    AuthController,
    RolesController,
    StudentsController,
    SchedulesController,
    CoursesController,
  ],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
  ],
})
export class ApiModule {}
