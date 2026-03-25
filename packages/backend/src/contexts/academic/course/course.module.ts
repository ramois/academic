import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CourseResourceService } from './application/course-resource.service';
import { CourseService } from './application/course.service';
import { COURSE_RESOURCE_REPOSITORY } from './domain/course-resource.repository';
import { COURSE_REPOSITORY } from './domain/course.repository';
import { CourseResourceTypeOrmEntity } from './infrastructure/course-resource-typeorm.entity';
import { CourseResourceTypeOrmRepository } from './infrastructure/course-resource-typeorm.repository';
import { CourseTypeOrmEntity } from './infrastructure/course-typeorm.entity';
import { CourseTypeOrmRepository } from './infrastructure/course-typeorm.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([CourseTypeOrmEntity, CourseResourceTypeOrmEntity]),
  ],
  providers: [
    CourseService,
    CourseResourceService,
    {
      provide: COURSE_REPOSITORY,
      useClass: CourseTypeOrmRepository,
    },
    {
      provide: COURSE_RESOURCE_REPOSITORY,
      useClass: CourseResourceTypeOrmRepository,
    },
  ],
  exports: [CourseService, CourseResourceService],
})
export class CourseModule {}
