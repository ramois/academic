import { Test, TestingModule } from '@nestjs/testing';
import { StudentService } from './student.service';
import { STUDENT_REPOSITORY } from '../domain/student.repository';
import { RoleService } from '../../../identity-access/roles/application/role.service';
import { UserService } from '../../../identity-access/users/application/user.service';
import { Student } from '../domain/student.entity';

describe('StudentService', () => {
  let service: StudentService;
  let studentRepo: {
    findAll: jest.Mock;
    findById: jest.Mock;
    findPaginated: jest.Mock;
    save: jest.Mock;
    delete: jest.Mock;
    existsByCode: jest.Mock;
  };
  let roleService: { findByName: jest.Mock };
  let userService: {
    findById: jest.Mock;
    create: jest.Mock;
    findByUsername: jest.Mock;
    updateEmail: jest.Mock;
    delete: jest.Mock;
  };

  const studentRole = { id: 'role-1', name: 'STUDENT', permissions: [] };
  const mockUser = {
    id: 'user-1',
    username: 'jdoe',
    email: 'jdoe@academic.local',
    roleId: 'role-1',
    password: 'hash',
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

  beforeEach(async () => {
    studentRepo = {
      findAll: jest.fn(),
      findById: jest.fn(),
      findPaginated: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
      existsByCode: jest.fn(),
    };
    roleService = { findByName: jest.fn() };
    userService = {
      findById: jest.fn(),
      create: jest.fn(),
      findByUsername: jest.fn(),
      updateEmail: jest.fn(),
      delete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StudentService,
        { provide: STUDENT_REPOSITORY, useValue: studentRepo },
        { provide: RoleService, useValue: roleService },
        { provide: UserService, useValue: userService },
      ],
    }).compile();

    service = module.get<StudentService>(StudentService);
  });

  describe('findAll', () => {
    it('debería devolver todos los estudiantes', async () => {
      studentRepo.findAll.mockResolvedValue([mockStudent]);
      const result = await service.findAll();
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('student-1');
      expect(studentRepo.findAll).toHaveBeenCalledTimes(1);
    });
  });

  describe('findAllWithUserInfo', () => {
    it('debería devolver estudiantes con username y email', async () => {
      studentRepo.findAll.mockResolvedValue([mockStudent]);
      userService.findById.mockResolvedValue(mockUser);
      const result = await service.findAllWithUserInfo();
      expect(result).toHaveLength(1);
      expect(result[0].username).toBe('jdoe');
      expect(result[0].email).toBe('jdoe@academic.local');
      expect(userService.findById).toHaveBeenCalledWith('user-1');
    });

    it('debería usar strings vacíos si el usuario no existe', async () => {
      studentRepo.findAll.mockResolvedValue([mockStudent]);
      userService.findById.mockResolvedValue(null);
      const result = await service.findAllWithUserInfo();
      expect(result[0].username).toBe('');
      expect(result[0].email).toBe('');
    });
  });

  describe('findById', () => {
    it('debería devolver el estudiante si existe', async () => {
      studentRepo.findById.mockResolvedValue(mockStudent);
      const result = await service.findById('student-1');
      expect(result).toEqual(mockStudent);
      expect(studentRepo.findById).toHaveBeenCalledWith('student-1');
    });

    it('debería devolver null si no existe', async () => {
      studentRepo.findById.mockResolvedValue(null);
      const result = await service.findById('inexistente');
      expect(result).toBeNull();
    });
  });

  describe('findByIdWithUserInfo', () => {
    it('debería devolver null si el estudiante no existe', async () => {
      studentRepo.findById.mockResolvedValue(null);
      const result = await service.findByIdWithUserInfo('inexistente');
      expect(result).toBeNull();
      expect(userService.findById).not.toHaveBeenCalled();
    });

    it('debería devolver estudiante con username y email', async () => {
      studentRepo.findById.mockResolvedValue(mockStudent);
      userService.findById.mockResolvedValue(mockUser);
      const result = await service.findByIdWithUserInfo('student-1');
      expect(result).not.toBeNull();
      expect(result!.username).toBe('jdoe');
      expect(result!.email).toBe('jdoe@academic.local');
    });
  });

  describe('create', () => {
    const createDto = {
      firstName: 'Jane',
      lastName: 'Smith',
      document: '87654321',
      birthDate: '2001-05-15',
      email: 'jane@test.com',
    };

    beforeEach(() => {
      roleService.findByName.mockResolvedValue(studentRole);
      userService.findByUsername.mockResolvedValue(null);
      studentRepo.existsByCode.mockResolvedValue(false);
      userService.create.mockResolvedValue(mockUser);
      studentRepo.save.mockImplementation((s: Student) => Promise.resolve(s));
    });

    it('debería crear usuario y estudiante y devolver el estudiante', async () => {
      const result = await service.create(createDto);
      expect(roleService.findByName).toHaveBeenCalledWith('STUDENT');
      expect(userService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          username: expect.stringMatching(/^jsmith/),
          email: 'jane@test.com',
          roleId: 'role-1',
        }),
      );
      expect(studentRepo.save).toHaveBeenCalled();
      expect(result.firstName).toBe('Jane');
      expect(result.lastName).toBe('Smith');
      expect(result.document).toBe('87654321');
    });

    it('debería lanzar si el rol STUDENT no existe', async () => {
      roleService.findByName.mockResolvedValue(null);
      await expect(service.create(createDto)).rejects.toThrow(
        'Rol STUDENT no existe',
      );
      expect(userService.create).not.toHaveBeenCalled();
    });

    it('debería generar username único si ya existe', async () => {
      userService.findByUsername
        .mockResolvedValueOnce({ id: 'u1' })
        .mockResolvedValueOnce(null);
      await service.create(createDto);
      expect(userService.create).toHaveBeenCalledWith(
        expect.objectContaining({ username: 'jsmith1' }),
      );
    });
  });

  describe('update', () => {
    it('debería devolver null si el estudiante no existe', async () => {
      studentRepo.findById.mockResolvedValue(null);
      const result = await service.update('inexistente', { firstName: 'X' });
      expect(result).toBeNull();
      expect(studentRepo.save).not.toHaveBeenCalled();
    });

    it('debería actualizar campos y guardar', async () => {
      studentRepo.save.mockImplementation((s: Student) => Promise.resolve(s));
      studentRepo.findById.mockResolvedValue(mockStudent);
      const result = await service.update('student-1', {
        firstName: 'Juan',
        lastName: 'Pérez',
      });
      expect(result).not.toBeNull();
      expect(result!.firstName).toBe('Juan');
      expect(result!.lastName).toBe('Pérez');
      expect(studentRepo.save).toHaveBeenCalled();
    });

    it('debería actualizar email del usuario si se envía', async () => {
      studentRepo.save.mockImplementation((s: Student) => Promise.resolve(s));
      studentRepo.findById.mockResolvedValue(mockStudent);
      userService.updateEmail.mockResolvedValue({});
      await service.update('student-1', { email: 'nuevo@mail.com' });
      expect(userService.updateEmail).toHaveBeenCalledWith(
        'user-1',
        'nuevo@mail.com',
      );
    });
  });

  describe('delete', () => {
    it('debería devolver false si el estudiante no existe', async () => {
      studentRepo.findById.mockResolvedValue(null);
      const result = await service.delete('inexistente');
      expect(result).toBe(false);
      expect(userService.delete).not.toHaveBeenCalled();
      expect(studentRepo.delete).not.toHaveBeenCalled();
    });

    it('debería eliminar usuario y estudiante y devolver true', async () => {
      studentRepo.findById.mockResolvedValue(mockStudent);
      userService.delete.mockResolvedValue(undefined);
      studentRepo.delete.mockResolvedValue(undefined);
      const result = await service.delete('student-1');
      expect(result).toBe(true);
      expect(userService.delete).toHaveBeenCalledWith('user-1');
      expect(studentRepo.delete).toHaveBeenCalledWith('student-1');
    });
  });
});
