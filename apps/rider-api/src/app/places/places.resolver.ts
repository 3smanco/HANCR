import { Resolver, Query, Args, Float } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { PlacesService } from './places.service';
import { PlacePredictionType, PlaceLocationType } from './place.type';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Resolver()
export class PlacesResolver {
  constructor(private readonly places: PlacesService) {}

  /** بحث عن مكان بالاسم (اقتراحات). */
  @Query(() => [PlacePredictionType], { description: 'بحث عن مكان بالاسم' })
  @UseGuards(JwtAuthGuard)
  searchPlaces(
    @Args('query') query: string,
    @Args('lat', { type: () => Float, nullable: true }) lat?: number,
    @Args('lng', { type: () => Float, nullable: true }) lng?: number,
  ): Promise<PlacePredictionType[]> {
    return this.places.search(query, lat, lng);
  }

  /** إحداثيات مكان من معرّفه. */
  @Query(() => PlaceLocationType, {
    nullable: true,
    description: 'إحداثيات مكان من placeId',
  })
  @UseGuards(JwtAuthGuard)
  placeDetails(
    @Args('placeId') placeId: string,
  ): Promise<PlaceLocationType | null> {
    return this.places.details(placeId);
  }

  /** اسم الشارع/العنوان المختصر من إحداثيات (لشاشة ضبط الالتقاط). */
  @Query(() => PlaceLocationType, {
    nullable: true,
    description: 'عنوان مختصر من إحداثيات (reverse geocode)',
  })
  @UseGuards(JwtAuthGuard)
  reverseGeocode(
    @Args('lat', { type: () => Float }) lat: number,
    @Args('lng', { type: () => Float }) lng: number,
  ): Promise<PlaceLocationType | null> {
    return this.places.reverseGeocode(lat, lng);
  }
}
