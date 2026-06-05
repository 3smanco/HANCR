import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { AdminUserEntity } from '@hancr/database';
import {
  AdminOperatorType,
  CreateOperatorInput,
  ResetOperatorPasswordInput,
  UpdateOperatorInput,
} from './dto/operator.types';

@Injectable()
export class OperatorsService {
  constructor(
    @InjectRepository(AdminUserEntity)
    private readonly repo: Repository<AdminUserEntity>,
  ) {}

  async list(): Promise<AdminOperatorType[]> {
    const rows = await this.repo.find({ order: { id: 'ASC' } });
    return rows.map((r) => this.toType(r));
  }

  async create(input: CreateOperatorInput): Promise<AdminOperatorType> {
    const email = input.email.toLowerCase().trim();
    const existing = await this.repo.findOne({ where: { email } });
    if (existing) {
      throw new BadRequestException('Email already in use');
    }
    const passwordHash = await bcrypt.hash(input.password, 10);
    const saved = await this.repo.save(
      this.repo.create({
        email,
        passwordHash,
        fullName: input.fullName,
        role: input.role,
        active: true,
      }),
    );
    return this.toType(saved);
  }

  async update(input: UpdateOperatorInput): Promise<AdminOperatorType> {
    const row = await this.repo.findOne({ where: { id: input.id } });
    if (!row) throw new NotFoundException('Operator not found');
    if (input.fullName !== undefined) row.fullName = input.fullName;
    if (input.role !== undefined) row.role = input.role;
    if (input.active !== undefined) row.active = input.active;
    const saved = await this.repo.save(row);
    return this.toType(saved);
  }

  async resetPassword(
    input: ResetOperatorPasswordInput,
  ): Promise<AdminOperatorType> {
    const row = await this.repo.findOne({ where: { id: input.id } });
    if (!row) throw new NotFoundException('Operator not found');
    row.passwordHash = await bcrypt.hash(input.newPassword, 10);
    const saved = await this.repo.save(row);
    return this.toType(saved);
  }

  async remove(id: number, callerId: number): Promise<boolean> {
    if (id === callerId) {
      throw new BadRequestException('You cannot delete yourself');
    }
    // Prevent removing the last super admin
    const target = await this.repo.findOne({ where: { id } });
    if (!target) return false;
    if (target.role === 'super') {
      const superCount = await this.repo.count({
        where: { role: 'super', active: true },
      });
      if (superCount <= 1) {
        throw new BadRequestException(
          'Cannot delete the last super admin',
        );
      }
    }
    const r = await this.repo.delete(id);
    return (r.affected ?? 0) > 0;
  }

  private toType(r: AdminUserEntity): AdminOperatorType {
    return {
      id: r.id,
      email: r.email,
      fullName: r.fullName,
      role: r.role,
      active: r.active,
      lastLoginAt: r.lastLoginAt,
      createdAt: r.createdAt,
    };
  }
}
