import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SavedGroupEntity, SavedGroupMember } from '@hancr/database';
import { SavedGroupType } from './dto/saved-group.type';

@Injectable()
export class SavedGroupService {
  constructor(
    @InjectRepository(SavedGroupEntity)
    private readonly repo: Repository<SavedGroupEntity>,
  ) {}

  private toType(g: SavedGroupEntity): SavedGroupType {
    return {
      id: g.id,
      name: g.name,
      type: g.type,
      members: g.members ?? [],
      createdAt: g.createdAt,
    };
  }

  private normType(type?: string): string {
    return type === 'business' ? 'business' : 'personal';
  }

  private normMembers(members?: SavedGroupMember[]): SavedGroupMember[] {
    return (members ?? [])
      .filter((m) => m && m.phone && m.phone.trim().length > 0)
      .slice(0, 50)
      .map((m) => ({
        name: (m.name ?? '').toString().slice(0, 100),
        phone: m.phone.toString().slice(0, 24),
      }));
  }

  async list(ownerId: number): Promise<SavedGroupType[]> {
    const rows = await this.repo.find({
      where: { ownerId },
      order: { createdAt: 'DESC' },
    });
    return rows.map((g) => this.toType(g));
  }

  async create(
    ownerId: number,
    name: string,
    type?: string,
    members?: SavedGroupMember[],
  ): Promise<SavedGroupType> {
    const g = await this.repo.save(
      this.repo.create({
        ownerId,
        name: (name ?? '').trim().slice(0, 100) || 'مجموعة',
        type: this.normType(type),
        members: this.normMembers(members),
      }),
    );
    return this.toType(g);
  }

  async update(
    ownerId: number,
    id: number,
    name?: string,
    type?: string,
    members?: SavedGroupMember[],
  ): Promise<SavedGroupType> {
    const g = await this.repo.findOne({ where: { id, ownerId } });
    if (!g) throw new NotFoundException('المجموعة غير موجودة');
    await this.repo.update(g.id, {
      ...(name != null && { name: name.trim().slice(0, 100) }),
      ...(type != null && { type: this.normType(type) }),
      ...(members != null && { members: this.normMembers(members) }),
    });
    const fresh = await this.repo.findOne({ where: { id, ownerId } });
    return this.toType(fresh!);
  }

  async remove(ownerId: number, id: number): Promise<boolean> {
    const g = await this.repo.findOne({ where: { id, ownerId } });
    if (!g) throw new ForbiddenException('المجموعة غير موجودة');
    await this.repo.delete(g.id);
    return true;
  }
}
