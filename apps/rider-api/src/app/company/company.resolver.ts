import { Resolver, Query } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { CompanyService } from './company.service';
import { MyCompanyType } from './dto/company.types';
import { JwtAuthGuard, CurrentUser } from '../auth/jwt-auth.guard';
import { AuthUser } from '../auth/jwt.strategy';

@Resolver(() => MyCompanyType)
export class CompanyResolver {
  constructor(private readonly service: CompanyService) {}

  @Query(() => MyCompanyType, {
    nullable: true,
    description: 'شركة الراكب الموظف (إن وُجدت)',
  })
  @UseGuards(JwtAuthGuard)
  myCompany(@CurrentUser() user: AuthUser): Promise<MyCompanyType | null> {
    return this.service.myCompany(user.riderId);
  }
}
