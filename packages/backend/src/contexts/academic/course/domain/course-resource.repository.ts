import { CourseResource } from './course-resource.entity';

export const COURSE_RESOURCE_REPOSITORY = Symbol('COURSE_RESOURCE_REPOSITORY');

export interface ICourseResourceRepository {
  findByCourseId(courseId: string): Promise<CourseResource[]>;
  findById(id: string): Promise<CourseResource | null>;
  save(resource: CourseResource): Promise<CourseResource>;
  delete(id: string): Promise<boolean>;
}
