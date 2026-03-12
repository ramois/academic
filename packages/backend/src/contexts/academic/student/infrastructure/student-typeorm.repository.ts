import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Student } from '../domain/student.entity';
import { IStudentRepository, type FindPaginatedOptions, type StudentSortField } from '../domain/student.repository';
import { StudentTypeOrmEntity } from './student-typeorm.entity';

const SORT_FIELD_MAP: Record<StudentSortField, keyof StudentTypeOrmEntity> = {
  firstName: 'firstName',
  lastName: 'lastName',
  code: 'code',
  document: 'document',
  birthDate: 'birthDate',
  createdAt: 'createdAt',
};

@Injectable()
export class StudentTypeOrmRepository implements IStudentRepository {
  constructor(
    @InjectRepository(StudentTypeOrmEntity)
    private readonly repo: Repository<StudentTypeOrmEntity>,
  ) {}

  async findAll(): Promise<Student[]> {
    const rows = await this.repo.find({ order: { createdAt: 'ASC' } });
    return rows.map((r) => this.toDomain(r));
  }

  async findPaginated(options: FindPaginatedOptions): Promise<{ data: Student[]; total: number }> {
    const { offset, limit, sortBy = 'createdAt', sortOrder = 'asc' } = options;
    const orderField = SORT_FIELD_MAP[sortBy] ?? 'createdAt';
    const [rows, total] = await this.repo.findAndCount({
      order: { [orderField]: sortOrder.toUpperCase() as 'ASC' | 'DESC' },
      skip: offset,
      take: limit,
    });
    return { data: rows.map((r) => this.toDomain(r)), total };
  }

  async findById(id: string): Promise<Student | null> {
    const row = await this.repo.findOne({ where: { id } });
    return row ? this.toDomain(row) : null;
  }

  async count(): Promise<number> {
    return this.repo.count();
  }

  async save(student: Student): Promise<Student> {
    const row = this.repo.create({
      id: student.id,
      firstName: student.firstName,
      lastName: student.lastName,
      document: student.document,
      birthDate: student.birthDate,
      code: student.code,
      userId: student.userId,
    });
    await this.repo.save(row);
    return student;
  }

  async delete(id: string): Promise<void> {
    await this.repo.delete(id);
  }

  async existsByCode(code: string): Promise<boolean> {
    const count = await this.repo.count({ where: { code } });
    return count > 0;
  }

  private toDomain(row: StudentTypeOrmEntity): Student {
    return new Student(
      row.id,
      row.firstName,
      row.lastName,
      row.document,
      row.birthDate,
      row.code,
      row.userId,
    );
  }
}
