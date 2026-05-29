import { Controller, Get } from '@nestjs/common';
import {
  HealthCheck,
  HealthCheckService,
  TypeOrmHealthIndicator,
  MemoryHealthIndicator,
} from '@nestjs/terminus';

/**
 * HealthController — endpoints صحة الخدمة للـ Kubernetes/Docker.
 *
 * GET /health/live      — هل العملية حيَّة؟ (مجرد ping)
 * GET /health/ready     — هل الخدمة جاهزة لاستقبال traffic؟ (DB + memory)
 */
@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly db: TypeOrmHealthIndicator,
    private readonly memory: MemoryHealthIndicator,
  ) {}

  /** Liveness probe — يجب أن يكون سريعاً (لا dependencies). */
  @Get('live')
  liveness(): { status: string; timestamp: string } {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }

  /** Readiness probe — يتحقق من DB + memory. */
  @Get('ready')
  @HealthCheck()
  readiness() {
    return this.health.check([
      () => this.db.pingCheck('database', { timeout: 1500 }),
      () => this.memory.checkHeap('memory_heap', 512 * 1024 * 1024), // 512 MB
      () => this.memory.checkRSS('memory_rss', 1024 * 1024 * 1024), // 1 GB
    ]);
  }
}
