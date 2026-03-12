import { Student } from './student.entity';

export const STUDENT_REPOSITORY = Symbol('STUDENT_REPOSITORY');

export type StudentSortField = 'firstName' | 'lastName' | 'code' | 'document' | 'birthDate' | 'createdAt';

export type FindPaginatedOptions = {
  offset: number;
  limit: number;
  sortBy?: StudentSortField;
  sortOrder?: 'asc' | 'desc';
};

export interface IStudentRepository {
  findAll(): Promise<Student[]>;
  findById(id: string): Promise<Student | null>;
  count(): Promise<number>;
  findPaginated(options: FindPaginatedOptions): Promise<{ data: Student[]; total: number }>;
  save(student: Student): Promise<Student>;
  delete(id: string): Promise<void>;
  existsByCode(code: string): Promise<boolean>;
}
