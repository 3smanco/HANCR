import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { SavedGroupType, SavedGroupMemberInput } from './dto/saved-group.type';
import { SavedGroupService } from './saved-group.service';
import { JwtAuthGuard, CurrentUser } from '../auth/jwt-auth.guard';
import { AuthUser } from '../auth/jwt.strategy';

@Resolver(() => SavedGroupType)
export class SavedGroupResolver {
  constructor(private readonly service: SavedGroupService) {}

  @Query(() => [SavedGroupType], { description: 'المجموعات المحفوظة للراكب' })
  @UseGuards(JwtAuthGuard)
  mySavedGroups(@CurrentUser() user: AuthUser): Promise<SavedGroupType[]> {
    return this.service.list(user.riderId);
  }

  @Mutation(() => SavedGroupType, { description: 'إنشاء مجموعة محفوظة' })
  @UseGuards(JwtAuthGuard)
  createSavedGroup(
    @CurrentUser() user: AuthUser,
    @Args('name') name: string,
    @Args('type', { nullable: true }) type?: string,
    @Args('members', { type: () => [SavedGroupMemberInput], nullable: true })
    members?: SavedGroupMemberInput[],
  ): Promise<SavedGroupType> {
    return this.service.create(user.riderId, name, type, members);
  }

  @Mutation(() => SavedGroupType, { description: 'تعديل مجموعة محفوظة' })
  @UseGuards(JwtAuthGuard)
  updateSavedGroup(
    @CurrentUser() user: AuthUser,
    @Args('id', { type: () => Int }) id: number,
    @Args('name', { nullable: true }) name?: string,
    @Args('type', { nullable: true }) type?: string,
    @Args('members', { type: () => [SavedGroupMemberInput], nullable: true })
    members?: SavedGroupMemberInput[],
  ): Promise<SavedGroupType> {
    return this.service.update(user.riderId, id, name, type, members);
  }

  @Mutation(() => Boolean, { description: 'حذف مجموعة محفوظة' })
  @UseGuards(JwtAuthGuard)
  deleteSavedGroup(
    @CurrentUser() user: AuthUser,
    @Args('id', { type: () => Int }) id: number,
  ): Promise<boolean> {
    return this.service.remove(user.riderId, id);
  }
}
