'use client';

import { useEffect, useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import {
  Plus,
  Trash2,
  X,
  Key,
  Shield,
  Wrench,
  DollarSign,
  Megaphone,
  HeadphonesIcon,
  Lock,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  LIST_OPERATORS,
  CREATE_OPERATOR,
  UPDATE_OPERATOR,
  RESET_OPERATOR_PASSWORD,
  DELETE_OPERATOR,
} from '@/lib/gql';
import { Topbar } from '@/components/layout/Topbar';
import { formatDate } from '@/lib/utils';

const ROLE_META: Record<
  string,
  { label: string; color: string; icon: typeof Shield }
> = {
  super: { label: 'مدير عام', color: 'text-red-600 bg-red-50', icon: Shield },
  ops: { label: 'عمليات', color: 'text-blue-600 bg-blue-50', icon: Wrench },
  finance: { label: 'مالية', color: 'text-emerald-600 bg-emerald-50', icon: DollarSign },
  marketing: { label: 'تسويق', color: 'text-purple-600 bg-purple-50', icon: Megaphone },
  support: { label: 'دعم', color: 'text-gray-600 bg-gray-50', icon: HeadphonesIcon },
};

type Operator = Record<string, unknown>;

export default function OperatorsPage() {
  const [creating, setCreating] = useState(false);
  const [resettingId, setResettingId] = useState<number | null>(null);
  const { data, loading, refetch, error } = useQuery(LIST_OPERATORS);

  useEffect(() => {
    if (error) {
      toast.error(error.message);
    }
  }, [error]);

  const [createOp, { loading: saving }] = useMutation(CREATE_OPERATOR, {
    onCompleted: () => {
      toast.success('تم إنشاء المشرف');
      setCreating(false);
      refetch();
    },
    onError: (e) => toast.error(e.message),
  });
  const [updateOp] = useMutation(UPDATE_OPERATOR, {
    onCompleted: () => {
      toast.success('تم التحديث');
      refetch();
    },
    onError: (e) => toast.error(e.message),
  });
  const [resetPwd, { loading: resetting }] = useMutation(
    RESET_OPERATOR_PASSWORD,
    {
      onCompleted: () => {
        toast.success('تم إعادة تعيين كلمة المرور');
        setResettingId(null);
      },
      onError: (e) => toast.error(e.message),
    },
  );
  const [deleteOp] = useMutation(DELETE_OPERATOR, {
    onCompleted: () => {
      toast.success('تم الحذف');
      refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  const ops: Operator[] = data?.adminOperators ?? [];

  return (
    <div>
      <Topbar
        title="المشرفون والصلاحيات"
        subtitle={`${ops.length} مشرف`}
      />

      <div className="p-6 space-y-5">
        <div className="card p-4 bg-amber-50 border-amber-200 flex items-start gap-2">
          <Lock className="w-5 h-5 text-amber-700 mt-0.5 shrink-0" />
          <div className="text-sm text-amber-800">
            هذه الصفحة متاحة فقط للمدير العام (super). الصلاحيات تُطبَّق
            على mutations الحرجة: تعديل المحافظ (finance)، اعتماد السائقين
            وتعيين سائق يدوياً (ops)، الإشعارات الجماعية (marketing).
          </div>
        </div>

        <div className="flex justify-end">
          <button onClick={() => setCreating(true)} className="btn-primary">
            <Plus className="w-4 h-4" />
            مشرف جديد
          </button>
        </div>

        {loading ? (
          <div className="card p-12 text-center text-gray-400">
            جارٍ التحميل…
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {ops.map((op) => {
              const meta = ROLE_META[op.role as string] ?? ROLE_META.support;
              const Icon = meta.icon;
              const active = op.active as boolean;
              return (
                <div
                  key={op.id as number}
                  className={`card p-5 ${!active ? 'opacity-60' : ''}`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div
                      className={`flex items-center justify-center w-12 h-12 rounded-xl ${meta.color}`}
                    >
                      <Icon className="w-6 h-6" />
                    </div>
                    <span
                      className={`badge ${active ? 'badge-green' : 'badge-gray'}`}
                    >
                      {active ? 'نشط' : 'موقوف'}
                    </span>
                  </div>

                  <h3 className="font-extrabold text-gray-900 text-lg truncate">
                    {(op.fullName as string) ?? '—'}
                  </h3>
                  <p className="text-sm text-gray-500 mt-0.5 truncate">
                    {op.email as string}
                  </p>

                  <div className="mt-3 pt-3 border-t border-gray-100 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">الدور</span>
                      <select
                        value={op.role as string}
                        onChange={(e) =>
                          updateOp({
                            variables: {
                              input: { id: op.id, role: e.target.value },
                            },
                          })
                        }
                        className="input py-1 text-xs w-32"
                      >
                        {Object.keys(ROLE_META).map((r) => (
                          <option key={r} value={r}>
                            {ROLE_META[r].label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-gray-500">آخر دخول</span>
                      <span className="text-xs text-gray-700">
                        {op.lastLoginAt
                          ? formatDate(op.lastLoginAt as string)
                          : '—'}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-1.5 mt-4">
                    <button
                      onClick={() =>
                        updateOp({
                          variables: {
                            input: { id: op.id, active: !active },
                          },
                        })
                      }
                      className="btn-sm btn-outline"
                    >
                      {active ? 'إيقاف' : 'تفعيل'}
                    </button>
                    <button
                      onClick={() => setResettingId(op.id as number)}
                      className="btn-sm btn-outline"
                    >
                      <Key className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (
                          confirm(
                            `حذف المشرف ${op.email}؟ لا يمكن التراجع.`,
                          )
                        )
                          deleteOp({ variables: { id: op.id } });
                      }}
                      className="btn-sm btn-outline text-red-600"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {creating && (
        <CreateModal
          saving={saving}
          onClose={() => setCreating(false)}
          onSave={(input) => createOp({ variables: { input } })}
        />
      )}

      {resettingId !== null && (
        <ResetPasswordModal
          resetting={resetting}
          onClose={() => setResettingId(null)}
          onSave={(newPassword) =>
            resetPwd({
              variables: { input: { id: resettingId, newPassword } },
            })
          }
        />
      )}
    </div>
  );
}

function CreateModal({
  saving,
  onClose,
  onSave,
}: {
  saving: boolean;
  onClose: () => void;
  onSave: (input: Record<string, unknown>) => void;
}) {
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('support');

  return (
    <Modal title="مشرف جديد" onClose={onClose}>
      <Field label="البريد الإلكتروني" value={email} onChange={setEmail} type="email" />
      <Field label="الاسم الكامل" value={fullName} onChange={setFullName} />
      <Field label="كلمة المرور (8 أحرف +)" value={password} onChange={setPassword} type="password" />
      <div>
        <label className="label">الدور</label>
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="input"
        >
          {Object.entries(ROLE_META).map(([k, m]) => (
            <option key={k} value={k}>
              {m.label}
            </option>
          ))}
        </select>
      </div>
      <div className="flex gap-2 mt-6">
        <button onClick={onClose} className="btn-outline flex-1">
          إلغاء
        </button>
        <button
          disabled={saving || !email || password.length < 8}
          onClick={() => onSave({ email, fullName, password, role })}
          className="btn-primary flex-1"
        >
          {saving ? 'جارٍ الحفظ…' : 'إنشاء'}
        </button>
      </div>
    </Modal>
  );
}

function ResetPasswordModal({
  resetting,
  onClose,
  onSave,
}: {
  resetting: boolean;
  onClose: () => void;
  onSave: (newPassword: string) => void;
}) {
  const [pwd, setPwd] = useState('');
  return (
    <Modal title="إعادة تعيين كلمة المرور" onClose={onClose}>
      <Field
        label="كلمة المرور الجديدة (8 أحرف +)"
        value={pwd}
        onChange={setPwd}
        type="password"
      />
      <div className="flex gap-2 mt-6">
        <button onClick={onClose} className="btn-outline flex-1">
          إلغاء
        </button>
        <button
          disabled={resetting || pwd.length < 8}
          onClick={() => onSave(pwd)}
          className="btn-primary flex-1"
        >
          {resetting ? 'جارٍ…' : 'إعادة تعيين'}
        </button>
      </div>
    </Modal>
  );
}

function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="card-elevated w-full max-w-md p-6"
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
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <div>
      <label className="label">{label}</label>
      <input
        type={type}
        className="input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
