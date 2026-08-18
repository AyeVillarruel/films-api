import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UsersService } from './users.service';

@Injectable()
export class SeedService implements OnModuleInit {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit() {
    const nodeEnv = this.configService.get<string>('NODE_ENV', 'development');
    const adminEmail = this.configService.get<string>('ADMIN_EMAIL');
    const adminPassword = this.configService.get<string>('ADMIN_PASSWORD');

    if (nodeEnv === 'production' && (!adminEmail || !adminPassword)) {
      this.logger.warn(
        'Seed de admin omitido: definí ADMIN_EMAIL y ADMIN_PASSWORD',
      );
      return;
    }

    const email = adminEmail || 'admin@example.com';
    const password = adminPassword || 'admin123';
    const name = this.configService.get<string>('ADMIN_NAME', 'Administrador');

    const existingAdmin = await this.usersService.findByEmail(email);

    if (existingAdmin) {
      return;
    }

    await this.usersService.createAdmin({ email, password, name });
    this.logger.log(`Administrador inicial creado: ${email}`);
  }
}
