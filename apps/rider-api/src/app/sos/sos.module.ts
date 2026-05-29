import { Module } from '@nestjs/common';
import { SosModule as HancrSosModule } from '@hancr/sos';
import { SosResolver } from './sos.resolver';

/**
 * App-level SosModule للراكب — يربط مكتبة @hancr/sos بـ GraphQL resolver.
 */
@Module({
  imports: [HancrSosModule],
  providers: [SosResolver],
})
export class SosModule {}
