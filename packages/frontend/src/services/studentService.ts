import { apiRequest } from '../lib';
import type { Student, CreateStudentDto, UpdateStudentDto } from '../entities';

export type { Student, CreateStudentDto, UpdateStudentDto } from '../entities';

export type StudentsPaginatedParams = {
  page: number;
  pageSize: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
};

export type StudentsPaginatedResponse = {
  data: Student[];
  total: number;
};

export async function getStudentsPaginated(
  params: StudentsPaginatedParams,
): Promise<StudentsPaginatedResponse> {
  const search = new URLSearchParams();
  search.set('page', String(params.page));
  search.set('pageSize', String(params.pageSize));
  if (params.sortBy) search.set('sortBy', params.sortBy);
  if (params.sortOrder) search.set('sortOrder', params.sortOrder);
  return apiRequest<StudentsPaginatedResponse>(`/students?${search.toString()}`, {
    defaultErrorMessage: 'Error al cargar alumnos',
  });
}

export async function createStudent(data: CreateStudentDto): Promise<Student> {
  return apiRequest<Student>('/students', {
    method: 'POST',
    body: JSON.stringify(data),
    defaultErrorMessage: 'Error al registrar alumno',
  });
}

export async function getStudents(): Promise<Student[]> {
  return apiRequest<Student[]>('/students', {
    defaultErrorMessage: 'Error al cargar alumnos',
  });
}

export async function getStudent(id: string): Promise<Student> {
  try {
    return await apiRequest<Student>(`/students/${id}`, {
      defaultErrorMessage: 'Estudiante no encontrado',
    });
  } catch (err) {
    if (err instanceof Error && /not found|no encontrado/i.test(err.message))
      throw new Error('Estudiante no encontrado');
    throw err;
  }
}

export async function updateStudent(
  id: string,
  data: UpdateStudentDto,
): Promise<Student> {
  return apiRequest<Student>(`/students/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
    defaultErrorMessage: 'Error al actualizar alumno',
  });
}

export async function deleteStudent(id: string): Promise<void> {
  try {
    await apiRequest<void>(`/students/${id}`, {
      method: 'DELETE',
      defaultErrorMessage: 'Error al eliminar alumno',
    });
  } catch (err) {
    if (err instanceof Error && /not found|no encontrado/i.test(err.message))
      throw new Error('Estudiante no encontrado');
    throw err;
  }
}
