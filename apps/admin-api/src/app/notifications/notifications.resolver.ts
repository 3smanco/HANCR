import { Resolver, Mutation, Args } from '@nestjs/graphql';
import { BadRequestException, UseGuards } from '@nestjs/common';
import { BroadcastService } from './broadcast.service';
import { BroadcastResultType, BroadcastTarget } from './dto/broadcast.types';
import { AdminJwtGuard } from '../auth/admin-jwt.guard';
import { AdminRolesGuard } from '../auth/admin-roles.guard';
import { RequireRole } from '../auth/roles.decorator';

@Resolver()
export class NotificationsResolver {
  constructor(private readonly broadcastService: BroadcastService) {}

  @Mutation(() => BroadcastResultType, {
    description: 'إرسال إشعار جماعي عبر FCM',
  })
  @UseGuards(AdminJwtGuard, AdminRolesGuard)
  @RequireRole('marketing')
  broadcastNotification(
    @Args('title') title: string,
    @Args('body') body: string,
    @Args('target', { type: () => BroadcastTarget }) target: BroadcastTarget,
  ): Promise<BroadcastResultType> {
    if (!title.trim() || !body.trim()) {
      throw new BadRequestException('العنوان والنص مطلوبان');
    }
    return this.broadcastService.broadcast(title.trim(), body.trim(), target);
  }
}
