'use client';

import { useState } from 'react';
import { useQuery, useMutation, useLazyQuery } from '@apollo/client';
import {
  Building2,
  Plus,
  Trash2,
  X,
  Wallet,
  Users,
  FileDown,
  UserPlus,
  UserMinus,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  LIST_COMPANIES,
  CREATE_COMPANY,
  TOP_UP_COMPANY,
  DELETE_COMPANY,
  LIST_COMPANY_EMPLOYEES,
  ADD_COMPANY_EMPLOYEE,
  REVOKE_COMPANY_EMPLOYEE,
  COMPANY_ORDERS_CSV,
} from '@/lib/gql';
import { Topbar } from '@/components/layout/Topbar';

type Company = Record<string, unknown>;
type Employee = Record<string, unknown>;

export default function CompaniesPage() {
  const [creating, setCreating] = useState(false);
  const [toppingUp, setToppingUp] = useState<Company | null>(null);
  const [showEmployees, setShowEmployees] = useState<Company | null>(null);
  const { data, loading, refetch } = useQuery(LIST_COMPANIES);

  const [deleteCompany] = useMutation(DELETE_COMPANY, {
    onCompleted: () => {
      toast.success('تم حذف الشركة');
      refetch();
    },
    onError: (e) => toast.error(e.message),
  });
  const [createCompany, { loading: saving }] = useMutation(CREATE_COMPANY, {
    onCompleted: () => {
      toast.success('تم إنشاء الشركة');
      setCreating(false);
      refetch();
    },
    onError: (e) => toast.error(e.message),
  });
  const [topUpCompany, { loading: topping }] = useMutation(TOP_UP_COMPANY, {
    onCompleted: () => {
      toast.success('تم شحن رصيد الشركة');
      setToppingUp(null);
      refetch();
    },
    onError: (e) => toast.error(e.message),
  });
  const [fetchCsv] = useLazyQuery(COMPANY_ORDERS_CSV, {
    fetchPolicy: 'network-only',
  });

  const companies: Company[] = data?.adminCompanies ?? [];

  const exportCsv = async (c: Company) => {
    const res = await fetchCsv({ variables: { companyId: c.id } });
    if (res.error) {
      toast.error(res.error.message);
      return;
    }
    const csv = (res.data?.companyOrdersCsv as string) ?? '';
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `company-${c.id}-orders.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <Topbar
        title="حسابات الشركات"
        subtitle={`${companies.length} شركة`}
      />
      <div className="p-6 space-y-5">
        <div className="flex justify-end">
          <button onClick={() => setCreating(true)} className="btn-primary">
            <Plus className="w-4 h-4" />
            شركة جديدة
          </button>
        </div>

        {loading ? (
          <div className="text-center py-16 text-gray-400">جارٍ التحميل…</div>
        ) : companies.length === 0 ? (
          <div className="card p-12 text-center">
            <Building2 className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-700 font-bold text-lg">لا توجد شركات</p>
            <p className="text-sm text-gray-500 mt-2">
              أنشئ أول شركة لإدارة حسابها مع موظفيها
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {companies.map((c) => {
              const active = c.status === 'active';
              return (
                <div
                  key={c.id as number}
                  className={`card p-5 ${!active ? 'opacity-60' : ''}`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-hancr-violet to-hancr-violet-deep text-white">
                      <Building2 className="w-6 h-6" />
                    </div>
                    <span className={`badge ${active ? 'badge-green' : 'badge-gray'}`}>
                      {active ? 'نشطة' : 'موقوفة'}
                    </span>
                  </div>

                  <h3 className="font-extrabold text-gray-900 text-xl">
                    {c.name as string}
                  </h3>
                  {c.contactEmail ? (
                    <p className="text-sm text-gray-500 mt-1 truncate">
                      {c.contactEmail as string}
                    </p>
                  ) : null}

                  <div className="mt-4 space-y-1.5 pt-3 border-t border-gray-100 text-sm">
                    <Row
                      label="الرصيد"
                      value={`${Number(c.balance).toFixed(2)} ${c.currency}`}
                    />
                    <Row
                      label="السقف الشهري لكل موظف"
                      value={
                        Number(c.monthlyCapPerEmployee) === 0
                          ? 'بلا سقف'
                          : `${Number(c.monthlyCapPerEmployee).toFixed(2)}`
                      }
                    />
                    <Row label="الموظفون" value={`${c.employeeCount}`} />
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-4">
                    <button
                      onClick={() => setToppingUp(c)}
                      className="btn-sm btn-success"
                    >
                      <Wallet className="w-3.5 h-3.5" />
                      شحن
                    </button>
                    <button
                      onClick={() => setShowEmployees(c)}
                      className="btn-sm btn-outline"
                    >
                      <Users className="w-3.5 h-3.5" />
                      الموظفون
                    </button>
                    <button
                      onClick={() => exportCsv(c)}
                      className="btn-sm btn-outline"
                    >
                      <FileDown className="w-3.5 h-3.5" />
                      CSV
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`حذف الشركة ${c.name}؟`))
                          deleteCompany({ variables: { id: c.id } });
                      }}
                      className="btn-sm btn-outline text-red-600"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      حذف
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {creating && (
        <CreateCompanyModal
          saving={saving}
          onClose={() => setCreating(false)}
          onSave={(input) => createCompany({ variables: { input } })}
        />
      )}

      {toppingUp && (
        <TopUpModal
          company={toppingUp}
          saving={topping}
          onClose={() => setToppingUp(null)}
          onSave={(amount) =>
            topUpCompany({
              variables: { input: { companyId: toppingUp.id, amount } },
            })
          }
        />
      )}

      {showEmployees && (
        <EmployeesDrawer
          company={showEmployees}
          onClose={() => setShowEmployees(null)}
        />
      )}
    </div>
  );
}

function CreateCompanyModal({
  saving,
  onClose,
  onSave,
}: {
  saving: boolean;
  onClose: () => void;
  onSave: (input: Record<string, unknown>) => void;
}) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [currency, setCurrency] = useState('SAR');
  const [cap, setCap] = useState('0');

  return (
    <ModalShell title="شركة جديدة" onClose={onClose}>
      <Field label="الاسم" value={name} onChange={setName} />
      <Field label="البريد الإلكتروني" value={email} onChange={setEmail} />
      <Field label="رقم الهاتف" value={phone} onChange={setPhone} />
      <Field label="العملة" value={currency} onChange={setCurrency} />
      <Field
        label="السقف الشهري لكل موظف (0 = بلا)"
        value={cap}
        onChange={setCap}
        type="number"
      />
      <div className="flex gap-2 mt-6">
        <button onClick={onClose} className="btn-outline flex-1">
          إلغاء
        </button>
        <button
          disabled={saving}
          onClick={() => {
            if (!name.trim()) {
              toast.error('أدخل اسم الشركة');
              return;
            }
            onSave({
              name: name.trim(),
              contactEmail: email.trim() || undefined,
              contactPhone: phone.trim() || undefined,
              currency: currency.toUpperCase() || 'SAR',
              monthlyCapPerEmployee: Number(cap),
            });
          }}
          className="btn-primary flex-1"
        >
          {saving ? 'جارٍ الحفظ…' : 'إنشاء'}
        </button>
      </div>
    </ModalShell>
  );
}

function TopUpModal({
  company,
  saving,
  onClose,
  onSave,
}: {
  company: Company;
  saving: boolean;
  onClose: () => void;
  onSave: (amount: number) => void;
}) {
  const [amount, setAmount] = useState('1000');
  return (
    <ModalShell title={`شحن رصيد ${company.name}`} onClose={onClose}>
      <p className="text-sm text-gray-500 mb-3">
        الرصيد الحالي: {Number(company.balance).toFixed(2)} {company.currency as string}
      </p>
      <Field
        label="مقدار الشحن"
        value={amount}
        onChange={setAmount}
        type="number"
      />
      <div className="flex gap-2 mt-6">
        <button onClick={onClose} className="btn-outline flex-1">
          إلغاء
        </button>
        <button
          disabled={saving}
          onClick={() => {
            const n = Number(amount);
            if (!Number.isFinite(n) || n <= 0) {
              toast.error('قيمة غير صحيحة');
              return;
            }
            onSave(n);
          }}
          className="btn-primary flex-1"
        >
          {saving ? 'جارٍ الشحن…' : 'شحن'}
        </button>
      </div>
    </ModalShell>
  );
}

function EmployeesDrawer({
  company,
  onClose,
}: {
  company: Company;
  onClose: () => void;
}) {
  const { data, loading, refetch } = useQuery(LIST_COMPANY_EMPLOYEES, {
    variables: { companyId: company.id },
    fetchPolicy: 'network-only',
  });
  const [addEmployee, { loading: adding }] = useMutation(ADD_COMPANY_EMPLOYEE, {
    onCompleted: () => {
      toast.success('تمت إضافة الموظف');
      refetch();
    },
    onError: (e) => toast.error(e.message),
  });
  const [revokeEmployee] = useMutation(REVOKE_COMPANY_EMPLOYEE, {
    onCompleted: () => {
      toast.success('تم إلغاء صلاحية الموظف');
      refetch();
    },
    onError: (e) => toast.error(e.message),
  });
  const [phone, setPhone] = useState('');
  const employees: Employee[] = data?.companyEmployees ?? [];

  return (
    <ModalShell title={`موظفو ${company.name}`} onClose={onClose} wide>
      <div className="flex gap-2 mb-4">
        <input
          className="input flex-1"
          placeholder="رقم هاتف الراكب (+966500000001)"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
        <button
          disabled={adding}
          onClick={() => {
            if (!phone.trim()) {
              toast.error('أدخل رقم الهاتف');
              return;
            }
            addEmployee({
              variables: {
                input: {
                  companyId: company.id,
                  riderPhone: phone.trim(),
                },
              },
            });
            setPhone('');
          }}
          className="btn-primary"
        >
          <UserPlus className="w-4 h-4" />
          إضافة
        </button>
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-400">جارٍ التحميل…</div>
      ) : employees.length === 0 ? (
        <div className="text-center py-8 text-gray-400">لا يوجد موظفون</div>
      ) : (
        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {employees.map((e) => {
            const active = e.status === 'active';
            return (
              <div
                key={e.id as number}
                className={`flex items-center justify-between p-3 rounded-lg border ${
                  active
                    ? 'border-gray-200 bg-white'
                    : 'border-gray-100 bg-gray-50 opacity-60'
                }`}
              >
                <div>
                  <p className="font-bold text-gray-900 text-sm">
                    {(e.riderName as string) ||
                      `Rider #${e.riderId as number}`}
                  </p>
                  <p className="text-xs text-gray-500">
                    {e.riderPhone as string}
                  </p>
                  <p className="text-xs text-gray-500">
                    صُرف {Number(e.monthlySpent).toFixed(2)} {company.currency as string}{' '}
                    ({e.monthlyPeriod as string})
                  </p>
                </div>
                {active ? (
                  <button
                    onClick={() => revokeEmployee({ variables: { id: e.id } })}
                    className="btn-sm btn-outline text-red-600"
                  >
                    <UserMinus className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <span className="badge badge-gray">موقوف</span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </ModalShell>
  );
}

function ModalShell({
  title,
  onClose,
  children,
  wide = false,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className={`card-elevated w-full ${
          wide ? 'max-w-2xl' : 'max-w-md'
        } p-6 max-h-[90vh] overflow-y-auto`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-extrabold text-gray-900 text-lg">{title}</h2>
          <button onClick={onClose} className="btn-icon">
            <X className="w-4 h-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <div className="mb-3">
      <label className="label">{label}</label>
      <input
        type={type}
        inputMode={type === 'number' ? 'decimal' : 'text'}
        className="input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-gray-500">{label}</span>
      <span className="font-bold text-gray-900">{value}</span>
    </div>
  );
}
