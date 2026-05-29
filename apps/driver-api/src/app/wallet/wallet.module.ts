import { Module } from '@nestjs/common';
import { WalletModule as HancrWalletModule } from '@hancr/wallet';
import { WalletResolver } from './wallet.resolver';

/**
 * App-level WalletModule للسائق — يربط مكتبة @hancr/wallet بـ GraphQL resolver.
 */
@Module({
  imports: [HancrWalletModule],
  providers: [WalletResolver],
})
export class WalletModule {}
