import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import {
  CourseResource,
  CourseResourceType,
} from '../domain/course-resource.entity';
import {
  ICourseResourceRepository,
  COURSE_RESOURCE_REPOSITORY,
} from '../domain/course-resource.repository';
import { ICourseRepository, COURSE_REPOSITORY } from '../domain/course.repository';

export type CreateCourseResourceInput = {
  resourceType: CourseResourceType;
  title: string;
  description?: string | null;
  url?: string | null;
  fileName?: string | null;
  mimeType?: string | null;
  sortOrder?: number;
  metadata?: Record<string, unknown> | null;
};

export type UpdateCourseResourceInput = Partial<CreateCourseResourceInput>;

@Injectable()
export class CourseResourceService {
  constructor(
    @Inject(COURSE_REPOSITORY)
    private readonly courseRepository: ICourseRepository,
    @Inject(COURSE_RESOURCE_REPOSITORY)
    private readonly resourceRepository: ICourseResourceRepository,
  ) {}

  async listByCourse(courseId: string): Promise<CourseResource[]> {
    await this.ensureCourseExists(courseId);
    return this.resourceRepository.findByCourseId(courseId);
  }

  async findOne(courseId: string, resourceId: string): Promise<CourseResource> {
    await this.ensureCourseExists(courseId);
    const resource = await this.resourceRepository.findById(resourceId);
    if (!resource || resource.courseId !== courseId) {
      throw new NotFoundException('Course resource not found');
    }
    return resource;
  }

  async create(
    courseId: string,
    input: CreateCourseResourceInput,
  ): Promise<CourseResource> {
    await this.ensureCourseExists(courseId);
    const id = crypto.randomUUID();
    const now = new Date();
    const resource = new CourseResource(
      id,
      courseId,
      input.resourceType,
      input.title,
      input.description ?? null,
      input.url ?? null,
      input.fileName ?? null,
      input.mimeType ?? null,
      input.sortOrder ?? 0,
      input.metadata ?? null,
      now,
      now,
    );
    return this.resourceRepository.save(resource);
  }

  async update(
    courseId: string,
    resourceId: string,
    input: UpdateCourseResourceInput,
  ): Promise<CourseResource> {
    const existing = await this.findOne(courseId, resourceId);
    const updated = new CourseResource(
      existing.id,
      existing.courseId,
      input.resourceType !== undefined
        ? input.resourceType
        : existing.resourceType,
      input.title !== undefined ? input.title : existing.title,
      input.description !== undefined ? input.description : existing.description,
      input.url !== undefined ? input.url : existing.url,
      input.fileName !== undefined ? input.fileName : existing.fileName,
      input.mimeType !== undefined ? input.mimeType : existing.mimeType,
      input.sortOrder !== undefined ? input.sortOrder : existing.sortOrder,
      input.metadata !== undefined ? input.metadata : existing.metadata,
      existing.createdAt,
      new Date(),
    );
    return this.resourceRepository.save(updated);
  }

  async remove(courseId: string, resourceId: string): Promise<void> {
    await this.findOne(courseId, resourceId);
    const deleted = await this.resourceRepository.delete(resourceId);
    if (!deleted) throw new NotFoundException('Course resource not found');
  }

  private async ensureCourseExists(courseId: string): Promise<void> {
    const course = await this.courseRepository.findById(courseId);
    if (!course) throw new NotFoundException('Course not found');
  }
}
