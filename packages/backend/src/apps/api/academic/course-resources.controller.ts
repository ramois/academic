import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
} from '@nestjs/common';
import { CourseResourceService } from '../../../contexts/academic/course/application/course-resource.service';
import { CreateCourseResourceDto } from './dto/create-course-resource.dto';
import { UpdateCourseResourceDto } from './dto/update-course-resource.dto';

@Controller('courses/:courseId/resources')
export class CourseResourcesController {
  constructor(private readonly courseResourceService: CourseResourceService) {}

  @Get()
  list(@Param('courseId') courseId: string) {
    return this.courseResourceService.listByCourse(courseId);
  }

  @Post()
  create(
    @Param('courseId') courseId: string,
    @Body() body: CreateCourseResourceDto,
  ) {
    return this.courseResourceService.create(courseId, body);
  }

  @Get(':resourceId')
  findOne(
    @Param('courseId') courseId: string,
    @Param('resourceId') resourceId: string,
  ) {
    return this.courseResourceService.findOne(courseId, resourceId);
  }

  @Patch(':resourceId')
  update(
    @Param('courseId') courseId: string,
    @Param('resourceId') resourceId: string,
    @Body() body: UpdateCourseResourceDto,
  ) {
    return this.courseResourceService.update(courseId, resourceId, body);
  }

  @Delete(':resourceId')
  async remove(
    @Param('courseId') courseId: string,
    @Param('resourceId') resourceId: string,
  ) {
    await this.courseResourceService.remove(courseId, resourceId);
  }
}
