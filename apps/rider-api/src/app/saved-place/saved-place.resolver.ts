import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { SavedPlaceService } from './saved-place.service';
import { SavedPlaceInput, SavedPlaceType } from './dto/saved-place.types';
import { JwtAuthGuard, CurrentUser } from '../auth/jwt-auth.guard';
import { AuthUser } from '../auth/jwt.strategy';

@Resolver(() => SavedPlaceType)
export class SavedPlaceResolver {
  constructor(private readonly service: SavedPlaceService) {}

  @Query(() => [SavedPlaceType], { description: 'الأماكن المفضّلة للراكب' })
  @UseGuards(JwtAuthGuard)
  savedPlaces(@CurrentUser() user: AuthUser): Promise<SavedPlaceType[]> {
    return this.service.list(user.riderId);
  }

  @Mutation(() => SavedPlaceType, { description: 'إضافة مكان مفضّل' })
  @UseGuards(JwtAuthGuard)
  addSavedPlace(
    @CurrentUser() user: AuthUser,
    @Args('input') input: SavedPlaceInput,
  ): Promise<SavedPlaceType> {
    return this.service.add(user.riderId, input);
  }

  @Mutation(() => Boolean, { description: 'حذف مكان مفضّل' })
  @UseGuards(JwtAuthGuard)
  deleteSavedPlace(
    @CurrentUser() user: AuthUser,
    @Args('id', { type: () => Int }) id: number,
  ): Promise<boolean> {
    return this.service.remove(user.riderId, id);
  }
}
