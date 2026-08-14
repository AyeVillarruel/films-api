import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { UsersService } from './users.service';

@Injectable()
export class SeedService implements OnModuleInit {
  private readonly logger = new Logger(SeedService.name);

  constructor(private readonly usersService: UsersService) {}

  async onModuleInit() {
    const email = process.env.ADMIN_EMAIL || 'admin@example.com';
    const password = process.env.ADMIN_PASSWORD || 'admin123';
    const name = process.env.ADMIN_NAME || 'Administrador';

    const existingAdmin = await this.usersService.findByEmail(email);

    if (existingAdmin) {
      return;
    }

    await this.usersService.createAdmin({ email, password, name });
    this.logger.log(`Administrador inicial creado: ${email}`);
  }
}
