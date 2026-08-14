import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Role } from '../common/enums/role.enum';
import { RegisterDto } from './dto/register.dto';
import { User } from './entities/user.entity';
import { UsersService } from './users.service';

jest.mock('bcrypt');

describe('UsersService', () => {
  let service: UsersService;

  const mockUser: User = {
    id: 'uuid-1',
    email: 'test@example.com',
    password: 'hashedPassword',
    name: 'Test User',
    role: Role.USER,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    jest.clearAllMocks();
  });

  describe('create', () => {
    const registerDto: RegisterDto = {
      email: 'test@example.com',
      password: 'password123',
      name: 'Test User',
    };

    it('debería crear un usuario con rol user', async () => {
      mockRepository.findOne.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');
      mockRepository.create.mockReturnValue(mockUser);
      mockRepository.save.mockResolvedValue(mockUser);

      const result = await service.create(registerDto);

      expect(result).not.toHaveProperty('password');
      expect(result.email).toBe(registerDto.email);
      expect(result.role).toBe(Role.USER);
      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ role: Role.USER }),
      );
    });

    it('debería crear un administrador con createAdmin', async () => {
      const adminUser = { ...mockUser, role: Role.ADMIN };
      mockRepository.findOne.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');
      mockRepository.create.mockReturnValue(adminUser);
      mockRepository.save.mockResolvedValue(adminUser);

      const result = await service.createAdmin(registerDto);

      expect(result.role).toBe(Role.ADMIN);
    });

    it('debería lanzar ConflictException si el email ya existe', async () => {
      mockRepository.findOne.mockResolvedValue(mockUser);

      await expect(service.create(registerDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('findById', () => {
    it('debería retornar un usuario por id', async () => {
      mockRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.findById('uuid-1');

      expect(result).toEqual(mockUser);
    });

    it('debería lanzar NotFoundException si el usuario no existe', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findById('invalid-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('sanitizeUser', () => {
    it('debería remover la contraseña del usuario', () => {
      const result = service.sanitizeUser(mockUser);

      expect(result).not.toHaveProperty('password');
      expect(result.email).toBe(mockUser.email);
    });
  });
});
