import {
  IsIn,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';
import {
  COURSE_RESOURCE_TYPES,
  type CourseResourceType,
} from '../../../../contexts/academic/course/domain/course-resource.entity';

export class UpdateCourseResourceDto {
  @IsOptional()
  @IsIn([...COURSE_RESOURCE_TYPES])
  resourceType?: CourseResourceType;

  @IsOptional()
  @IsString()
  @MinLength(1)
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  url?: string;

  @IsOptional()
  @IsString()
  fileName?: string;

  @IsOptional()
  @IsString()
  mimeType?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
