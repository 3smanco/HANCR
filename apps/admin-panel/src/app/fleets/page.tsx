'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import {
  Bus,
  Plus,
  X,
  Trash2,
  Wallet,
  Users,
  UserPlus,
  UserMinus,
  Edit3,
  AlertTriangle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';
import {
  LIST_FLEETS,
  CREATE_FLEET,
  UPDATE_FLEET,
  TOP_UP_FLEET,
  DELETE_FLEET,
  FLEET_DRIVERS,
  ASSIGN_DRIVER_TO_FLEET,
  UNASSIGN_DRIVER_FROM_FLEET,
  FLEET_DOCUMENT_ALERTS,
} from '@/lib/gql';
import { Topbar } from '@/components/layout/Topbar';

type Fleet = Record<string, unknown>;
type Driver = Record<string, unknown>;

export default function FleetsPage() {
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Fleet | null>(null);
  const [showDrivers, setShowDrivers] = useState<Fleet | null>(null);
  const [topUp, setTopUp] = useState<Fleet | null>(null);

  const { data, loading, refetch } = useQuery(LIST_FLEETS);
  const [createFleet, { loading: saving }] = useMutation(CREATE_FLEET, {
    onCompleted: () => {
      toast.success('تم الإنشاء');
      setCreating(false);
      refetch();
    },
    onError: (e) => toast.error(e.message),
  });
  const [updateFleet, { loading: updating }] = useMutation(UPDATE_FLEET, {
    onCompleted: () => {
      toast.success('تم التحديث');
      setEditing(null);
      refetch();
    },
    onError: (e) => toast.error(e.message),
  });
  const [topUpFleet, { loading: topping }] = useMutation(TOP_UP_FLEET, {
    onCompleted: () => {
      toast.success('تم شحن الرصيد');
      setTopUp(null);
      refetch();
    },
    onError: (e) => toast.error(e.message),
  });
  const [delFleet] = useMutation(DELETE_FLEET, {
    onCompleted: () => {
      toast.success('تم الحذف');
      refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  const fleets: Fleet[] = data?.adminFleets ?? [];

  return (
    <div>
      <Topbar
        title="الأساطيل"
        subtitle={`${fleets.length} أسطول`}
      />
      <div className="p-6 space-y-5">
        <div className="flex justify-end">
          <button onClick={() => setCreating(true)} className="btn-primary">
            <Plus className="w-4 h-4" />
            أسطول جديد
          </button>
        </div>

        <FleetDocAlertsBoard />

        {loading ? (
          <div className="card p-12 text-center text-gray-400">جارٍ التحميل…</div>
        ) : fleets.length === 0 ? (
          <div className="card p-12 text-center text-gray-400">
            <Bus className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>لا توجد أساطيل</p>
            <p className="text-xs mt-2">
              أنشئ أسطولاً لإدارة سائقيه بشكل مستقل + عمولة منفصلة + مناطق حصرية
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {fleets.map((f) => {
              const active = f.active as boolean;
              const exclusivity = (f.exclusivityRegionIds as number[]) ?? [];
              return (
                <div
                  key={f.id as number}
                  className={`card p-5 ${!active ? 'opacity-60' : ''}`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 text-white">
                      <Bus className="w-6 h-6" />
                    </div>
                    <span
                      className={`badge ${active ? 'badge-green' : 'badge-gray'}`}
                    >
                      {active ? 'نشط' : 'موقوف'}
                    </span>
                  </div>

                  <h3 className="font-extrabold text-gray-900 text-lg truncate">
                    {f.name as string}
                  </h3>
                  {f.ownerName ? (
                    <p className="text-xs text-gray-500 mt-0.5 truncate">
                      المالك: {f.ownerName as string}
                    </p>
                  ) : null}

                  <div className="mt-3 pt-3 border-t border-gray-100 space-y-1.5 text-sm">
                    <Row
                      label="الرصيد"
                      value={`${Number(f.balance).toFixed(2)} ${f.currency}`}
                    />
                    <Row
                      label="نسبة العمولة"
                      value={`${Number(f.commissionPercent).toFixed(1)}%`}
                    />
                    <Row label="السائقون" value={`${f.driverCount as number}`} />
                    {exclusivity.length > 0 ? (
                      <Row
                        label="مناطق حصرية"
                        value={`${exclusivity.length}`}
                      />
                    ) : null}
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-4">
                    <button
                      onClick={() => setTopUp(f)}
                      className="btn-sm btn-success"
                    >
                      <Wallet className="w-3.5 h-3.5" />
                      شحن
                    </button>
                    <button
                      onClick={() => setShowDrivers(f)}
                      className="btn-sm btn-outline"
                    >
                      <Users className="w-3.5 h-3.5" />
                      السائقون
                    </button>
                    <button
                      onClick={() => setEditing(f)}
                      className="btn-sm btn-outline"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      تعديل
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`حذف الأسطول "${f.name}"؟`))
                          delFleet({ variables: { id: f.id } });
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
        <FleetModal
          saving={saving}
          onClose={() => setCreating(false)}
          onSave={(input) => createFleet({ variables: { input } })}
        />
      )}
      {editing && (
        <FleetModal
          fleet={editing}
          saving={updating}
          onClose={() => setEditing(null)}
          onSave={(input) =>
            updateFleet({
              variables: { input: { id: editing.id, ...input } },
            })
          }
        />
      )}
      {topUp && (
        <TopUpModal
          fleet={topUp}
          saving={topping}
          onClose={() => setTopUp(null)}
          onSave={(amount) =>
            topUpFleet({
              variables: { input: { fleetId: topUp.id, amount } },
            })
          }
        />
      )}
      {showDrivers && (
        <DriversDrawer
          fleet={showDrivers}
          onClose={() => {
            setShowDrivers(null);
            refetch();
          }}
        />
      )}
    </div>
  );
}

// ── Fleet document-expiry alerts board (Phase 7) ─────────────────────────────

const FLEET_DOC_LABEL: Record<string, string> = {
  national_id: 'الهوية',
  license: 'الرخصة',
  vehicle_registration: 'الاستمارة',
  insurance: 'التأمين',
  criminal_record: 'العدلية',
  pco_license: 'رخصة PCO',
  dbs_check: 'فحص DBS',
};

type DocAlert = {
  driverId: number;
  driverName: string;
  countryIso?: string | null;
  countryName?: string | null;
  docType: string;
  expiresAt: string;
  daysToExpiry: number;
  severity: string;
};

function FleetDocAlertsBoard() {
  const { data, loading } = useQuery(FLEET_DOCUMENT_ALERTS, {
    variables: { withinDays: 30 },
    fetchPolicy: 'cache-and-network',
  });
  if (loading && !data) return null;
  const board = data?.fleetDocumentAlerts;
  if (!board) return null;

  const total = board.expiredCount + board.criticalCount + board.soonCount;
  if (total === 0) {
    return (
      <div className="card p-4 flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200">
        <AlertTriangle className="w-4 h-4" />
        كل وثائق سائقي الأسطول سارية خلال الـ30 يوماً القادمة ✓
      </div>
    );
  }

  const sevStyle = (s: string) =>
    s === 'expired'
      ? 'bg-red-100 text-red-700'
      : s === 'critical'
        ? 'bg-orange-100 text-orange-700'
        : 'bg-amber-100 text-amber-700';
  const sevLabel = (s: string) =>
    s === 'expired' ? 'منتهٍ' : s === 'critical' ? 'حرج' : 'قريباً';

  return (
    <div className="card overflow-hidden">
      <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2 flex-wrap">
        <AlertTriangle className="w-5 h-5 text-amber-500" />
        <span className="font-extrabold text-gray-900">
          تنبيهات انتهاء وثائق الأسطول
        </span>
        <span className="text-xs text-gray-400">(خلال 30 يوماً)</span>
        <div className="flex gap-1.5 mr-auto text-xs">
          {board.expiredCount > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-bold">
              {board.expiredCount} منتهٍ
            </span>
          )}
          {board.criticalCount > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 font-bold">
              {board.criticalCount} حرج
            </span>
          )}
          {board.soonCount > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-bold">
              {board.soonCount} قريباً
            </span>
          )}
        </div>
      </div>
      <table className="w-full">
        <thead>
          <tr>
            <th>السائق</th>
            <th>الدولة</th>
            <th>الوثيقة</th>
            <th>تنتهي</th>
            <th>الحالة</th>
          </tr>
        </thead>
        <tbody>
          {(board.alerts as DocAlert[]).slice(0, 50).map((a, i) => (
            <tr key={`${a.driverId}-${a.docType}-${i}`}>
              <td className="font-bold">
                <Link
                  href={`/users/drivers/${a.driverId}`}
                  className="text-hancr-violet hover:underline"
                >
                  {a.driverName}
                </Link>
              </td>
              <td className="text-xs">
                {a.countryName
                  ? `${a.countryName}${a.countryIso ? ` (${a.countryIso})` : ''}`
                  : '—'}
              </td>
              <td>{FLEET_DOC_LABEL[a.docType] ?? a.docType}</td>
              <td className="text-xs text-gray-500">
                {a.daysToExpiry < 0
                  ? `منذ ${Math.abs(a.daysToExpiry)} يوم`
                  : `بعد ${a.daysToExpiry} يوم`}
              </td>
              <td>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${sevStyle(a.severity)}`}
                >
                  {sevLabel(a.severity)}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
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

function FleetModal({
  fleet,
  saving,
  onClose,
  onSave,
}: {
  fleet?: Fleet;
  saving: boolean;
  onClose: () => void;
  onSave: (input: Record<string, unknown>) => void;
}) {
  const [name, setName] = useState((fleet?.name as string) ?? '');
  const [ownerName, setOwnerName] = useState((fleet?.ownerName as string) ?? '');
  const [phone, setPhone] = useState((fleet?.contactPhone as string) ?? '');
  const [email, setEmail] = useState((fleet?.contactEmail as string) ?? '');
  const [currency, setCurrency] = useState((fleet?.currency as string) ?? 'SAR');
  const [commissionPercent, setCommissionPercent] = useState(
    String((fleet?.commissionPercent as number) ?? 15),
  );
  const [exclusivityCsv, setExclusivityCsv] = useState(
    ((fleet?.exclusivityRegionIds as number[]) ?? []).join(','),
  );

  return (
    <ModalShell title={fleet ? 'تعديل أسطول' : 'أسطول جديد'} onClose={onClose}>
      <Field label="الاسم" value={name} onChange={setName} />
      <Field label="اسم المالك" value={ownerName} onChange={setOwnerName} />
      <Field label="هاتف التواصل" value={phone} onChange={setPhone} />
      <Field label="البريد الإلكتروني" value={email} onChange={setEmail} />
      {!fleet ? (
        <div>
          <label className="label">العملة</label>
          <input
            className="input uppercase"
            value={currency}
            maxLength={3}
            onChange={(e) => setCurrency(e.target.value)}
          />
        </div>
      ) : null}
      <Field
        label="نسبة العمولة (%)"
        value={commissionPercent}
        onChange={setCommissionPercent}
        type="number"
      />
      <Field
        label="معرّفات المناطق الحصرية (مفصولة بفواصل)"
        value={exclusivityCsv}
        onChange={setExclusivityCsv}
        placeholder="1, 2, 3"
      />
      <p className="text-xs text-gray-500">
        لو حُدِّدت مناطق حصرية، الطلبات في تلك المناطق ستُوجَّه فقط لسائقي هذا
        الأسطول.
      </p>

      <div className="flex gap-2 mt-6">
        <button onClick={onClose} className="btn-outline flex-1">
          إلغاء
        </button>
        <button
          disabled={saving || !name}
          onClick={() => {
            const ids = exclusivityCsv
              .split(',')
              .map((s) => Number(s.trim()))
              .filter((n) => !Number.isNaN(n) && n > 0);
            const base = {
              name: name.trim(),
              ownerName: ownerName.trim() || undefined,
              contactPhone: phone.trim() || undefined,
              contactEmail: email.trim() || undefined,
              commissionPercent: Number(commissionPercent) || 0,
              exclusivityRegionIds: ids,
            };
            const payload = fleet
              ? { ...base, active: fleet.active as boolean }
              : { ...base, currency: currency.toUpperCase() };
            onSave(payload);
          }}
          className="btn-primary flex-1"
        >
          {saving ? 'جارٍ…' : 'حفظ'}
        </button>
      </div>
    </ModalShell>
  );
}

function TopUpModal({
  fleet,
  saving,
  onClose,
  onSave,
}: {
  fleet: Fleet;
  saving: boolean;
  onClose: () => void;
  onSave: (amount: number) => void;
}) {
  const [amount, setAmount] = useState('1000');
  return (
    <ModalShell title={`شحن رصيد ${fleet.name}`} onClose={onClose}>
      <p className="text-sm text-gray-500 mb-3">
        الرصيد الحالي: {Number(fleet.balance).toFixed(2)}{' '}
        {fleet.currency as string}
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
          disabled={saving || Number(amount) <= 0}
          onClick={() => onSave(Number(amount))}
          className="btn-primary flex-1"
        >
          {saving ? 'جارٍ…' : 'شحن'}
        </button>
      </div>
    </ModalShell>
  );
}

function DriversDrawer({
  fleet,
  onClose,
}: {
  fleet: Fleet;
  onClose: () => void;
}) {
  const { data, loading, refetch } = useQuery(FLEET_DRIVERS, {
    variables: { fleetId: fleet.id },
    fetchPolicy: 'network-only',
  });
  const [assignDriver, { loading: assigning }] = useMutation(
    ASSIGN_DRIVER_TO_FLEET,
    {
      onCompleted: () => {
        toast.success('تم التعيين');
        refetch();
      },
      onError: (e) => toast.error(e.message),
    },
  );
  const [unassign] = useMutation(UNASSIGN_DRIVER_FROM_FLEET, {
    onCompleted: () => {
      toast.success('تم الإلغاء');
      refetch();
    },
    onError: (e) => toast.error(e.message),
  });
  const [newDriverId, setNewDriverId] = useState('');
  const drivers: Driver[] = data?.fleetDrivers ?? [];

  return (
    <ModalShell title={`سائقو ${fleet.name}`} onClose={onClose} wide>
      <div className="flex gap-2 mb-4">
        <input
          className="input flex-1"
          placeholder="معرّف السائق (Driver ID)"
          type="number"
          value={newDriverId}
          onChange={(e) => setNewDriverId(e.target.value)}
        />
        <button
          disabled={assigning || !newDriverId}
          onClick={() => {
            assignDriver({
              variables: {
                input: { fleetId: fleet.id, driverId: Number(newDriverId) },
              },
            });
            setNewDriverId('');
          }}
          className="btn-primary"
        >
          <UserPlus className="w-4 h-4" />
          إضافة
        </button>
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-400">جارٍ التحميل…</div>
      ) : drivers.length === 0 ? (
        <div className="text-center py-8 text-gray-400">لا يوجد سائقون</div>
      ) : (
        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {drivers.map((d) => (
            <div
              key={d.driverId as number}
              className="flex items-center justify-between p-3 rounded-lg border border-gray-200 bg-white"
            >
              <div>
                <div className="font-bold text-gray-900 text-sm">
                  #{d.driverId as number} —{' '}
                  {(d.driverName as string) ?? 'بدون اسم'}
                </div>
                <div className="text-xs text-gray-500 ltr">
                  {d.phoneNumber as string}
                  {d.plateNumber ? ` · ${d.plateNumber as string}` : ''}
                </div>
              </div>
              <button
                onClick={() => unassign({ variables: { driverId: d.driverId } })}
                className="btn-sm btn-outline text-red-600"
              >
                <UserMinus className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
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
        <div className="space-y-3">{children}</div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="label">{label}</label>
      <input
        type={type}
        className="input"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
