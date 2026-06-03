import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SavedPlaceEntity } from '@hancr/database';
import { SavedPlaceInput, SavedPlaceType } from './dto/saved-place.types';

@Injectable()
export class SavedPlaceService {
  constructor(
    @InjectRepository(SavedPlaceEntity)
    private readonly repo: Repository<SavedPlaceEntity>,
  ) {}

  async list(riderId: number): Promise<SavedPlaceType[]> {
    const places = await this.repo.find({
      where: { riderId },
      order: { createdAt: 'ASC' },
    });
    return places.map((p) => this.toType(p));
  }

  async add(riderId: number, input: SavedPlaceInput): Promise<SavedPlaceType> {
    const saved = await this.repo.save(
      this.repo.create({
        riderId,
        label: input.label.trim(),
        address: input.address.trim(),
        lat: input.lat,
        lng: input.lng,
        type: input.type ?? 'other',
      }),
    );
    return this.toType(saved);
  }

  async remove(riderId: number, id: number): Promise<boolean> {
    const res = await this.repo.delete({ id, riderId });
    return (res.affected ?? 0) > 0;
  }

  private toType(p: SavedPlaceEntity): SavedPlaceType {
    return {
      id: p.id,
      label: p.label,
      address: p.address,
      lat: Number(p.lat),
      lng: Number(p.lng),
      type: p.type,
    };
  }
}
