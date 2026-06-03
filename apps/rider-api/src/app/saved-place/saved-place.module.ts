import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SavedPlaceEntity } from '@hancr/database';
import { SavedPlaceService } from './saved-place.service';
import { SavedPlaceResolver } from './saved-place.resolver';

@Module({
  imports: [TypeOrmModule.forFeature([SavedPlaceEntity])],
  providers: [SavedPlaceService, SavedPlaceResolver],
})
export class SavedPlaceModule {}
