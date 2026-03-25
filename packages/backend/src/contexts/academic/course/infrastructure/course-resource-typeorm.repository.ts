import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CourseResource } from '../domain/course-resource.entity';
import { ICourseResourceRepository } from '../domain/course-resource.repository';
import { CourseResourceTypeOrmEntity } from './course-resource-typeorm.entity';

@Injectable()
export class CourseResourceTypeOrmRepository implements ICourseResourceRepository {
  constructor(
    @InjectRepository(CourseResourceTypeOrmEntity)
    private readonly repo: Repository<CourseResourceTypeOrmEntity>,
  ) {}

  async findByCourseId(courseId: string): Promise<CourseResource[]> {
    const rows = await this.repo.find({
      where: { courseId },
      order: { sortOrder: 'ASC', createdAt: 'ASC' },
    });
    return rows.map((r) => this.toDomain(r));
  }

  async findById(id: string): Promise<CourseResource | null> {
    const row = await this.repo.findOne({ where: { id } });
    return row ? this.toDomain(row) : null;
  }

  async save(resource: CourseResource): Promise<CourseResource> {
    const row = this.repo.create({
      id: resource.id,
      courseId: resource.courseId,
      resourceType: resource.resourceType,
      title: resource.title,
      description: resource.description,
      url: resource.url,
      fileName: resource.fileName,
      mimeType: resource.mimeType,
      sortOrder: resource.sortOrder,
      metadata: resource.metadata,
    });
    const saved = await this.repo.save(row);
    return this.toDomain(saved);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repo.delete(id);
    return (result.affected ?? 0) > 0;
  }

  private toDomain(row: CourseResourceTypeOrmEntity): CourseResource {
    return new CourseResource(
      row.id,
      row.courseId,
      row.resourceType,
      row.title,
      row.description,
      row.url,
      row.fileName,
      row.mimeType,
      row.sortOrder,
      row.metadata,
      row.createdAt,
      row.updatedAt,
    );
  }
}
