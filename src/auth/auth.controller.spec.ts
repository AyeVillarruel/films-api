import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;

  const mockAuthService = {
    register: jest.fn(),
    login: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: mockAuthService }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    jest.clearAllMocks();
  });

  it('debería delegar el registro en AuthService', async () => {
    const dto = {
      email: 'user@example.com',
      password: 'password123',
      name: 'Usuario',
    };
    mockAuthService.register.mockResolvedValue({ accessToken: 'token' });

    await controller.register(dto);

    expect(mockAuthService.register).toHaveBeenCalledWith(dto);
  });

  it('debería delegar el login en AuthService', async () => {
    const dto = {
      email: 'user@example.com',
      password: 'password123',
    };
    mockAuthService.login.mockResolvedValue({ accessToken: 'token' });

    await controller.login(dto);

    expect(mockAuthService.login).toHaveBeenCalledWith(dto);
  });
});
