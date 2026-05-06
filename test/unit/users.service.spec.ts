import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';

describe('UsersService', () => {
  let service: UsersService;
  let repository: jest.Mocked<Repository<User>>;

  const mockUser: User = {
    id: '1',
    email: 'test@example.com',
    name: 'Test User',
    password: 'hashedPassword',
    role: 'user',
    sessionVersion: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: {
            find: jest.fn(),
            findOneBy: jest.fn(),
            save: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    repository = module.get(getRepositoryToken(User));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return an array of users', async () => {
      repository.find.mockResolvedValue([mockUser]);
      const result = await service.findAll();
      expect(result).toEqual([mockUser]);
      expect(repository.find).toHaveBeenCalled();
    });
  });

  describe('findOneById', () => {
    it('should return a user by id', async () => {
      repository.findOneBy.mockResolvedValue(mockUser);
      const result = await service.findOneById('1');
      expect(result).toEqual(mockUser);
      expect(repository.findOneBy).toHaveBeenCalledWith({ id: '1' });
    });

    it('should throw error when id is empty', async () => {
      await expect(service.findOneById('')).rejects.toThrow('User ID is required');
    });

    it('should return null when user not found', async () => {
      repository.findOneBy.mockResolvedValue(null);
      const result = await service.findOneById('999');
      expect(result).toBeNull();
    });
  });

  describe('findOneByEmail', () => {
    it('should return a user by email', async () => {
      repository.findOneBy.mockResolvedValue(mockUser);
      const result = await service.findOneByEmail('test@example.com');
      expect(result).toEqual(mockUser);
      expect(repository.findOneBy).toHaveBeenCalledWith({ email: 'test@example.com' });
    });

    it('should throw error when email is empty', async () => {
      await expect(service.findOneByEmail('')).rejects.toThrow('User email is required');
    });
  });

  describe('create', () => {
    it('should create a user', async () => {
      repository.save.mockResolvedValue(mockUser);
      const result = await service.create(mockUser);
      expect(result).toEqual(mockUser);
      expect(repository.save).toHaveBeenCalledWith(mockUser);
    });

    it('should throw error when user data is missing', async () => {
      await expect(service.create(null as any)).rejects.toThrow('User data is required');
    });
  });

  describe('update', () => {
    it('should update a user', async () => {
      repository.update.mockResolvedValue({ affected: 1 } as any);
      repository.findOneBy.mockResolvedValue(mockUser);
      const result = await service.update('1', mockUser);
      expect(result).toEqual(mockUser);
      expect(repository.update).toHaveBeenCalledWith('1', mockUser);
    });

    it('should throw error when id is missing', async () => {
      await expect(service.update('', mockUser)).rejects.toThrow('User ID is required');
    });

    it('should throw error when user data is missing', async () => {
      await expect(service.update('1', null as any)).rejects.toThrow('User data is required');
    });
  });

  describe('delete', () => {
    it('should delete a user', async () => {
      repository.delete.mockResolvedValue({ affected: 1 } as any);
      await service.delete('1');
      expect(repository.delete).toHaveBeenCalledWith('1');
    });

    it('should throw error when id is missing', async () => {
      await expect(service.delete('')).rejects.toThrow('User ID is required');
    });
  });
});