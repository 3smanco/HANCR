import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SavedGroupEntity } from '@hancr/database';
import { SavedGroupResolver } from './saved-group.resolver';
import { SavedGroupService } from './saved-group.service';

@Module({
  imports: [TypeOrmModule.forFeature([SavedGroupEntity])],
  providers: [SavedGroupResolver, SavedGroupService],
})
export class SavedGroupModule {}
