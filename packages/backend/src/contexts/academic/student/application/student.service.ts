import { Injectable, Inject } from '@nestjs/common';
import { Student } from '../domain/student.entity';
import { IStudentRepository, STUDENT_REPOSITORY, type StudentSortField } from '../domain/student.repository';
import { RoleService } from '../../../identity-access/roles/application/role.service';
import { UserService } from '../../../identity-access/users/application/user.service';

export type StudentsPaginatedResult = {
  data: Array<Student & { username: string; email: string }>;
  total: number;
};

@Injectable()
export class StudentService {
  constructor(
    @Inject(STUDENT_REPOSITORY)
    private readonly studentRepository: IStudentRepository,
    private readonly roleService: RoleService,
    private readonly userService: UserService,
  ) {}

  async findAll(): Promise<Student[]> {
    return this.studentRepository.findAll();
  }

  async findAllWithUserInfo(): Promise<
    Array<Student & { username: string; email: string }>
  > {
    const students = await this.studentRepository.findAll();
    const result: Array<Student & { username: string; email: string }> = [];
    for (const student of students) {
      const user = await this.userService.findById(student.userId);
      result.push({
        ...student,
        username: user?.username ?? '',
        email: user?.email ?? '',
      });
    }
    return result;
  }

  async findPaginatedWithUserInfo(
    page: number,
    pageSize: number,
    sortBy?: StudentSortField,
    sortOrder?: 'asc' | 'desc',
  ): Promise<StudentsPaginatedResult> {
    const offset = (Math.max(1, page) - 1) * Math.max(1, pageSize);
    const limit = Math.min(100, Math.max(1, pageSize));
    const { data: students, total } = await this.studentRepository.findPaginated({
      offset,
      limit,
      sortBy,
      sortOrder,
    });
    const data: Array<Student & { username: string; email: string }> = [];
    for (const student of students) {
      const user = await this.userService.findById(student.userId);
      data.push({
        ...student,
        username: user?.username ?? '',
        email: user?.email ?? '',
      });
    }
    return { data, total };
  }

  async findById(id: string): Promise<Student | null> {
    return this.studentRepository.findById(id);
  }

  async findByIdWithUserInfo(id: string): Promise<
    (Student & { username: string; email: string }) | null
  > {
    const student = await this.studentRepository.findById(id);
    if (!student) return null;
    const user = await this.userService.findById(student.userId);
    return {
      ...student,
      username: user?.username ?? '',
      email: user?.email ?? '',
    };
  }

  async create(data: {
    firstName: string;
    lastName: string;
    document: string;
    birthDate: string;
    email?: string;
  }): Promise<Student> {
    const studentRole = await this.roleService.findByName('STUDENT');
    if (!studentRole) {
      throw new Error('Rol STUDENT no existe. Ejecuta los seeders.');
    }

    const baseUsername = this.buildBaseUsername(
      data.firstName.trim(),
      data.lastName.trim(),
    );
    const username = await this.ensureUniqueUsername(baseUsername);

    const email = data.email?.trim() || `${username}@academic.local`;
    const temporaryPassword = process.env.STUDENT_DEFAULT_PASSWORD ?? 'TempStudent1!';
    const user = await this.userService.create({
      username,
      email,
      roleId: studentRole.id,
      password: temporaryPassword,
    });

    const id = crypto.randomUUID();
    const code = await this.ensureUniqueCode();
    const birthDate = new Date(data.birthDate);
    const student = new Student(
      id,
      data.firstName.trim(),
      data.lastName.trim(),
      data.document.trim(),
      birthDate,
      code,
      user.id,
    );
    return this.studentRepository.save(student);
  }

  private buildBaseUsername(firstName: string, lastName: string): string {
    const initial = firstName.charAt(0).toLowerCase();
    const firstLastName = lastName.split(/\s+/)[0] ?? lastName;
    const normalized = firstLastName
      .toLowerCase()
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '');
    return `${initial}${normalized}`;
  }

  private async ensureUniqueUsername(base: string): Promise<string> {
    let username = base;
    let counter = 0;
    while (await this.userService.findByUsername(username)) {
      counter++;
      username = `${base}${counter}`;
    }
    return username;
  }

  private async ensureUniqueCode(): Promise<string> {
    let n = 1;
    let code: string;
    do {
      code = `ALUMNO-${String(n).padStart(5, '0')}`;
      n++;
    } while (await this.studentRepository.existsByCode(code));
    return code;
  }

  async update(
    id: string,
    data: {
      firstName?: string;
      lastName?: string;
      document?: string;
      birthDate?: string;
      email?: string;
    },
  ): Promise<Student | null> {
    const student = await this.studentRepository.findById(id);
    if (!student) return null;

    const firstName = data.firstName?.trim() ?? student.firstName;
    const lastName = data.lastName?.trim() ?? student.lastName;
    const document = data.document?.trim() ?? student.document;
    const birthDate = data.birthDate
      ? new Date(data.birthDate)
      : student.birthDate;

    const updated = new Student(
      student.id,
      firstName,
      lastName,
      document,
      birthDate,
      student.code,
      student.userId,
    );
    await this.studentRepository.save(updated);

    if (data.email !== undefined && data.email.trim() !== '') {
      await this.userService.updateEmail(student.userId, data.email.trim());
    }

    return updated;
  }

  async delete(id: string): Promise<boolean> {
    const student = await this.studentRepository.findById(id);
    if (!student) return false;
    await this.userService.delete(student.userId);
    await this.studentRepository.delete(id);
    return true;
  }
}
