import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { StudentsController } from './students.controller';
import { StudentService } from '../../../contexts/academic/student/application/student.service';
import { Student } from '../../../contexts/academic/student/domain/student.entity';

describe('StudentsController', () => {
  let controller: StudentsController;
  let studentService: {
    findAllWithUserInfo: jest.Mock;
    findPaginatedWithUserInfo: jest.Mock;
    findByIdWithUserInfo: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
  };

  const mockStudent = new Student(
    'student-1',
    'John',
    'Doe',
    '12345678',
    new Date('2000-01-01'),
    'ALUMNO-00001',
    'user-1',
  );
  const mockStudentWithUser = {
    ...mockStudent,
    username: 'jdoe',
    email: 'jdoe@academic.local',
  };

  beforeEach(async () => {
    studentService = {
      findAllWithUserInfo: jest.fn(),
      findPaginatedWithUserInfo: jest.fn(),
      findByIdWithUserInfo: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [StudentsController],
      providers: [
        { provide: StudentService, useValue: studentService },
      ],
    }).compile();

    controller = module.get<StudentsController>(StudentsController);
  });

  describe('findAll', () => {
    it('debería devolver la lista de estudiantes con info de usuario cuando no hay query params', async () => {
      studentService.findAllWithUserInfo.mockResolvedValue([mockStudentWithUser]);
      const result = await controller.findAll();
      expect(Array.isArray(result)).toBe(true);
      expect((result as typeof mockStudentWithUser[]).length).toBe(1);
      expect((result as typeof mockStudentWithUser[])[0].username).toBe('jdoe');
      expect(studentService.findAllWithUserInfo).toHaveBeenCalledTimes(1);
      expect(studentService.findPaginatedWithUserInfo).not.toHaveBeenCalled();
    });

    it('debería devolver paginado cuando se envían page y pageSize', async () => {
      studentService.findPaginatedWithUserInfo.mockResolvedValue({
        data: [mockStudentWithUser],
        total: 1,
      });
      const result = await controller.findAll('1', '10', 'firstName', 'asc');
      expect(result).toEqual({ data: [mockStudentWithUser], total: 1 });
      expect(studentService.findPaginatedWithUserInfo).toHaveBeenCalledWith(
        1,
        10,
        'firstName',
        'asc',
      );
      expect(studentService.findAllWithUserInfo).not.toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('debería devolver el estudiante si existe', async () => {
      studentService.findByIdWithUserInfo.mockResolvedValue(mockStudentWithUser);
      const result = await controller.findOne('student-1');
      expect(result).toEqual(mockStudentWithUser);
      expect(studentService.findByIdWithUserInfo).toHaveBeenCalledWith(
        'student-1',
      );
    });

    it('debería lanzar NotFoundException si no existe', async () => {
      studentService.findByIdWithUserInfo.mockResolvedValue(null);
      await expect(controller.findOne('inexistente')).rejects.toThrow(
        NotFoundException,
      );
      await expect(controller.findOne('inexistente')).rejects.toThrow(
        'Student not found',
      );
    });
  });

  describe('create', () => {
    it('debería crear estudiante y devolverlo', async () => {
      const body = {
        firstName: 'Jane',
        lastName: 'Smith',
        document: '87654321',
        birthDate: '2001-05-15',
        email: 'jane@test.com',
      };
      studentService.create.mockResolvedValue(mockStudent);
      const result = await controller.create(body);
      expect(studentService.create).toHaveBeenCalledWith(body);
      expect(result).toEqual(mockStudent);
    });
  });

  describe('update', () => {
    it('debería actualizar y devolver el estudiante', async () => {
      const body = { firstName: 'Juan', lastName: 'Pérez' };
      const updated = new Student(
        'student-1',
        'Juan',
        'Pérez',
        '12345678',
        mockStudent.birthDate,
        'ALUMNO-00001',
        'user-1',
      );
      studentService.update.mockResolvedValue(updated);
      const result = await controller.update('student-1', body);
      expect(studentService.update).toHaveBeenCalledWith('student-1', body);
      expect(result.firstName).toBe('Juan');
    });

    it('debería lanzar NotFoundException si no existe', async () => {
      studentService.update.mockResolvedValue(null);
      await expect(
        controller.update('inexistente', { firstName: 'X' }),
      ).rejects.toThrow(NotFoundException);
      await expect(
        controller.update('inexistente', { firstName: 'X' }),
      ).rejects.toThrow('Student not found');
    });
  });

  describe('remove', () => {
    it('debería llamar a delete y no lanzar', async () => {
      studentService.delete.mockResolvedValue(true);
      await expect(
        controller.remove('student-1'),
      ).resolves.toBeUndefined();
      expect(studentService.delete).toHaveBeenCalledWith('student-1');
    });

    it('debería lanzar NotFoundException si no existe', async () => {
      studentService.delete.mockResolvedValue(false);
      await expect(controller.remove('inexistente')).rejects.toThrow(
        NotFoundException,
      );
      await expect(controller.remove('inexistente')).rejects.toThrow(
        'Student not found',
      );
    });
  });
});
