import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { AdminUserEntity } from '@hancr/database';
import { Repository } from 'typeorm';
import { AdminAuthService } from './auth.resolver';

type Env = Record<string, string | undefined>;

type AdminRepoMock = {
  count: jest.Mock<Promise<number>, []>;
  create: jest.Mock<AdminUserEntity, [Partial<AdminUserEntity>]>;
  save: jest.Mock<Promise<AdminUserEntity>, [AdminUserEntity]>;
  findOne: jest.Mock;
};

function buildService(env: Env, adminCount = 0) {
  const cfg = {
    get: jest.fn((key: string) => env[key]),
  } as unknown as ConfigService;
  const jwtService = { sign: jest.fn() } as unknown as JwtService;
  const repo: AdminRepoMock = {
    count: jest.fn(async () => adminCount),
    create: jest.fn((input: Partial<AdminUserEntity>) => input as AdminUserEntity),
    save: jest.fn(async (input: AdminUserEntity) => input),
    findOne: jest.fn(),
  };

  return {
    service: new AdminAuthService(
      jwtService,
      cfg,
      repo as unknown as Repository<AdminUserEntity>,
    ),
    repo,
  };
}

describe('AdminAuthService bootstrap', () => {
  it('rejects weak production bootstrap passwords before saving', async () => {
    const { service, repo } = buildService({
      NODE_ENV: 'production',
      ADMIN_DEFAULT_EMAIL: 'owner@hancr.com',
      ADMIN_DEFAULT_PASSWORD: 'admin123456',
    });

    await expect(service.onModuleInit()).rejects.toThrow(
      /ADMIN_DEFAULT_PASSWORD/,
    );
    expect(repo.save).not.toHaveBeenCalled();
  });

  it('rejects missing production bootstrap emails before saving', async () => {
    const { service, repo } = buildService({
      NODE_ENV: 'production',
      ADMIN_DEFAULT_PASSWORD: 'A-strong-temporary-password-123',
    });

    await expect(service.onModuleInit()).rejects.toThrow(/ADMIN_DEFAULT_EMAIL/);
    expect(repo.save).not.toHaveBeenCalled();
  });

  it('seeds a normalized production bootstrap admin with strong credentials', async () => {
    const { service, repo } = buildService({
      NODE_ENV: 'production',
      ADMIN_DEFAULT_EMAIL: ' Owner@HANCR.COM ',
      ADMIN_DEFAULT_PASSWORD: 'A-strong-temporary-password-123',
    });

    await service.onModuleInit();

    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'owner@hancr.com',
        role: 'super',
        active: true,
        passwordHash: expect.any(String),
      }),
    );
    expect(repo.save).toHaveBeenCalledTimes(1);
  });

  it('does not seed when an admin already exists', async () => {
    const { service, repo } = buildService(
      {
        NODE_ENV: 'production',
        ADMIN_DEFAULT_EMAIL: 'owner@hancr.com',
        ADMIN_DEFAULT_PASSWORD: 'A-strong-temporary-password-123',
      },
      1,
    );

    await service.onModuleInit();

    expect(repo.create).not.toHaveBeenCalled();
    expect(repo.save).not.toHaveBeenCalled();
  });
});
