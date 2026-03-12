import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  createStudent,
  getStudents,
  getStudent,
  updateStudent,
  deleteStudent,
  type CreateStudentDto,
  type UpdateStudentDto,
} from './studentService';

/** Mock de Response compatible con lib/api (usa res.text()). */
function mockRes(overrides: {
  ok?: boolean;
  body?: unknown;
  status?: number;
} = {}) {
  const ok = overrides.ok ?? true;
  const body = overrides.body !== undefined ? JSON.stringify(overrides.body) : '';
  return {
    ok,
    status: overrides.status,
    json: () => Promise.resolve(overrides.body),
    text: () => Promise.resolve(body),
  };
}

vi.mock('../stores', () => ({
  getAuthHeaders: vi.fn(() => ({})),
}));

describe('studentService', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  describe('getStudents', () => {
    it('debería devolver la lista de estudiantes', async () => {
      const list = [
        {
          id: '1',
          firstName: 'John',
          lastName: 'Doe',
          document: '123',
          birthDate: '2000-01-01',
          code: 'ALUMNO-00001',
          userId: 'u1',
        },
      ];
      (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(mockRes({ body: list }));

      const result = await getStudents();

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/students'),
        expect.any(Object),
      );
      expect(result).toEqual(list);
    });

    it('debería lanzar si la respuesta no es ok', async () => {
      (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
        mockRes({ ok: false, body: {}, status: 500 }),
      );

      await expect(getStudents()).rejects.toThrow('Error al cargar alumnos');
    });
  });

  describe('getStudent', () => {
    it('debería devolver un estudiante por id', async () => {
      const student = {
        id: '1',
        firstName: 'John',
        lastName: 'Doe',
        document: '123',
        birthDate: '2000-01-01',
        code: 'ALUMNO-00001',
        userId: 'u1',
        username: 'jdoe',
        email: 'jdoe@test.com',
      };
      (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(mockRes({ body: student }));

      const result = await getStudent('1');

      expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/students/1'), expect.any(Object));
      expect(result).toEqual(student);
    });

    it('debería lanzar "Estudiante no encontrado" en 404', async () => {
      (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
        mockRes({ ok: false, status: 404, body: { message: 'Student not found' } }),
      );

      await expect(getStudent('inexistente')).rejects.toThrow(
        'Estudiante no encontrado',
      );
    });

    it('debería lanzar error genérico en otro error', async () => {
      (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
        mockRes({ ok: false, status: 500, body: { message: 'Error al cargar alumno' } }),
      );

      await expect(getStudent('1')).rejects.toThrow('Error al cargar alumno');
    });
  });

  describe('createStudent', () => {
    const dto: CreateStudentDto = {
      firstName: 'Jane',
      lastName: 'Smith',
      document: '87654321',
      birthDate: '2001-05-15',
      email: 'jane@test.com',
    };

    it('debería crear estudiante y devolverlo', async () => {
      const created = {
        id: '2',
        ...dto,
        code: 'ALUMNO-00002',
        userId: 'u2',
      };
      (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(mockRes({ body: created }));

      const result = await createStudent(dto);

      const call = (fetch as ReturnType<typeof vi.fn>).mock.calls[0];
      expect(call[0]).toMatch(/\/students$/);
      expect(call[1]).toMatchObject({ method: 'POST', body: JSON.stringify(dto) });
      expect(result).toEqual(created);
    });

    it('debería lanzar con mensaje del servidor si no es ok', async () => {
      (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
        mockRes({ ok: false, body: { message: 'Documento duplicado' } }),
      );

      await expect(createStudent(dto)).rejects.toThrow('Documento duplicado');
    });

    it('debería usar statusText cuando el json falla', async () => {
      (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        statusText: 'Server Error',
        text: () => Promise.resolve(''),
        json: () => Promise.reject(new Error('parse error')),
      });

      await expect(createStudent(dto)).rejects.toThrow('Server Error');
    });
  });

  describe('updateStudent', () => {
    const dto: UpdateStudentDto = { firstName: 'Juan', lastName: 'Pérez' };

    it('debería actualizar y devolver el estudiante', async () => {
      const updated = {
        id: '1',
        firstName: 'Juan',
        lastName: 'Pérez',
        document: '123',
        birthDate: '2000-01-01',
        code: 'ALUMNO-00001',
        userId: 'u1',
      };
      (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(mockRes({ body: updated }));

      const result = await updateStudent('1', dto);

      const call = (fetch as ReturnType<typeof vi.fn>).mock.calls[0];
      expect(call[0]).toMatch(/\/students\/1$/);
      expect(call[1]).toMatchObject({ method: 'PATCH', body: JSON.stringify(dto) });
      expect(result).toEqual(updated);
    });

    it('debería lanzar si la respuesta no es ok', async () => {
      (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
        mockRes({ ok: false, body: { message: 'Validation failed' } }),
      );

      await expect(updateStudent('1', dto)).rejects.toThrow('Validation failed');
    });
  });

  describe('deleteStudent', () => {
    it('debería enviar DELETE y no lanzar si ok', async () => {
      (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(mockRes());

      await expect(deleteStudent('1')).resolves.toBeUndefined();
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/students/1'),
        expect.objectContaining({ method: 'DELETE' }),
      );
    });

    it('debería lanzar "Estudiante no encontrado" en 404', async () => {
      (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
        mockRes({ ok: false, status: 404, body: { message: 'Student not found' } }),
      );

      await expect(deleteStudent('inexistente')).rejects.toThrow(
        'Estudiante no encontrado',
      );
    });

    it('debería lanzar error genérico en otro error', async () => {
      (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
        mockRes({ ok: false, status: 500, body: { message: 'Server error' } }),
      );

      await expect(deleteStudent('1')).rejects.toThrow('Server error');
    });
  });
});
