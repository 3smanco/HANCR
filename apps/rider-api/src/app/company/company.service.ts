import {
  BadRequestException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  CompanyEmployeeEntity,
  CompanyEntity,
  WalletOwnerType,
  WalletTransactionStatus,
  WalletTransactionType,
} from '@hancr/database';
import { WalletService } from '@hancr/wallet';
import { MyCompanyType } from './dto/company.types';

/**
 * F2 — Corporate Accounts (rider side).
 *
 * - myCompany(riderId): تُرجع معلومات شركته (إن كان موظفاً) لعرضها في
 *   شاشة الحجز كخيار دفع.
 * - chargeCompanyForOrder: يُستدعى من OrderService.createOrder عندما يختار
 *   الراكب paymentMode = Company.
 */
@Injectable()
export class CompanyService {
  private readonly logger = new Logger(CompanyService.name);

  constructor(
    @InjectRepository(CompanyEntity)
    private readonly companyRepo: Repository<CompanyEntity>,
    @InjectRepository(CompanyEmployeeEntity)
    private readonly empRepo: Repository<CompanyEmployeeEntity>,
    private readonly walletService: WalletService,
  ) {}

  /** يُرجع شركة الراكب الموظف (إن وُجدت ونشطة). */
  async findActiveLink(
    riderId: number,
  ): Promise<{
    company: CompanyEntity;
    employee: CompanyEmployeeEntity;
  } | null> {
    const emp = await this.empRepo.findOne({
      where: { riderId, status: 'active' },
    });
    if (!emp) return null;
    const company = await this.companyRepo.findOne({
      where: { id: emp.companyId },
    });
    if (!company || company.status !== 'active') return null;
    return { company, employee: emp };
  }

  async myCompany(riderId: number): Promise<MyCompanyType | null> {
    const link = await this.findActiveLink(riderId);
    if (!link) return null;
    const { company, employee } = link;
    // تطبيق فترة الشهر الحالية على المُجمَّع
    const period = this.currentPeriod();
    let monthlySpent = Number(employee.monthlySpent);
    if (employee.monthlyPeriod !== period) monthlySpent = 0;
    const cap = Number(company.monthlyCapPerEmployee);
    const remaining = cap === 0 ? 0 : Math.max(0, cap - monthlySpent);
    return {
      companyId: company.id,
      companyName: company.name,
      companyBalance: Number(company.balance),
      currency: company.currency,
      monthlyCapPerEmployee: cap,
      monthlySpent,
      monthlyRemaining: remaining,
      status: company.status,
    };
  }

  /**
   * إعداد ملف أعمال: ينشئ شركة جديدة ويربط الراكب بها كموظف نشط.
   * إن كان الراكب مرتبطاً بشركة فعّالة مسبقاً يعيدها كما هي.
   */
  async setupBusinessProfile(
    riderId: number,
    name: string,
    billingEmail?: string,
  ): Promise<MyCompanyType> {
    const existing = await this.findActiveLink(riderId);
    if (existing) {
      const my = await this.myCompany(riderId);
      if (my) return my;
    }
    const company = await this.companyRepo.save(
      this.companyRepo.create({
        name: (name ?? '').trim().slice(0, 200) || 'حسابي للأعمال',
        contactEmail: billingEmail?.trim()?.slice(0, 255),
        balance: 0,
        currency: 'SAR',
        monthlyCapPerEmployee: 0,
        status: 'active',
      }),
    );
    await this.empRepo.save(
      this.empRepo.create({
        companyId: company.id,
        riderId,
        monthlyPeriod: this.currentPeriod(),
        status: 'active',
      }),
    );
    const my = await this.myCompany(riderId);
    if (!my) {
      throw new BadRequestException('تعذّر إعداد ملف الأعمال.');
    }
    return my;
  }

  /**
   * يخصم الأجرة من رصيد الشركة ويزيد monthlySpent للموظف.
   * يرمي BadRequestException عند تجاوز السقف أو نقص الرصيد.
   *
   * يُستدعى من OrderService.createOrder بعد نجاح إنشاء الطلب.
   */
  async chargeForOrder(
    riderId: number,
    amount: number,
    currency: string,
    orderId: number,
  ): Promise<void> {
    if (amount <= 0) return;
    const link = await this.findActiveLink(riderId);
    if (!link) throw new BadRequestException('Not linked to any company');
    const { company, employee } = link;

    if (currency !== company.currency) {
      throw new BadRequestException(
        `Company currency ${company.currency} doesn't match order ${currency}`,
      );
    }

    // تحقّق السقف الشهري
    const period = this.currentPeriod();
    const spent =
      employee.monthlyPeriod === period ? Number(employee.monthlySpent) : 0;
    const cap = Number(company.monthlyCapPerEmployee);
    if (cap > 0 && spent + amount > cap) {
      throw new BadRequestException(
        `Monthly cap exceeded: ${spent} + ${amount} > ${cap}`,
      );
    }

    // خصم من رصيد الشركة (يرمي InsufficientBalanceError لو الرصيد ناقص)
    try {
      await this.walletService.debit({
        ownerType: WalletOwnerType.Company,
        ownerId: company.id,
        type: WalletTransactionType.TripPayment,
        amount,
        currency,
        status: WalletTransactionStatus.Completed,
        orderId,
        description: `Order #${orderId} (employee #${riderId})`,
      });
    } catch (e) {
      throw new BadRequestException(
        (e as Error).message || 'Company wallet debit failed',
      );
    }

    // تحديث monthlySpent للموظف
    await this.empRepo.update(
      { id: employee.id },
      {
        monthlySpent: spent + amount,
        monthlyPeriod: period,
      },
    );
    this.logger.log(
      `Company #${company.id} charged ${amount} ${currency} for order #${orderId}`,
    );
  }

  private currentPeriod(): string {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }
}
