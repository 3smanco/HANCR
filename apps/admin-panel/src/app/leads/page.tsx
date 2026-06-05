'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import {
  Mail,
  Phone,
  Building2,
  MapPin,
  Car,
  Briefcase,
  MessageSquare,
  HelpCircle,
  X,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { LIST_LEADS, UPDATE_LEAD_STATUS } from '@/lib/gql';
import { Topbar } from '@/components/layout/Topbar';
import { formatDate } from '@/lib/utils';

type Lead = {
  id: number;
  type: string;
  name: string;
  email: string;
  phone?: string | null;
  company?: string | null;
  city?: string | null;
  message?: string | null;
  status: string;
  createdAt: string;
};

const TYPE_META: Record<
  string,
  { label: string; icon: typeof Car; color: string }
> = {
  driver_signup: {
    label: 'تسجيل سائق',
    icon: Car,
    color: 'text-amber-600 bg-amber-50',
  },
  business: {
    label: 'مبيعات الأعمال',
    icon: Briefcase,
    color: 'text-blue-600 bg-blue-50',
  },
  contact: {
    label: 'اتصل بنا',
    icon: MessageSquare,
    color: 'text-emerald-600 bg-emerald-50',
  },
  careers: {
    label: 'وظائف',
    icon: Building2,
    color: 'text-purple-600 bg-purple-50',
  },
};

const STATUS_META: Record<string, { label: string; badge: string }> = {
  new: { label: 'جديد', badge: 'badge-yellow' },
  contacted: { label: 'تم التواصل', badge: 'badge-blue' },
  qualified: { label: 'مؤهَّل', badge: 'badge-green' },
  rejected: { label: 'مرفوض', badge: 'badge-gray' },
};

export default function LeadsPage() {
  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [selected, setSelected] = useState<Lead | null>(null);
  const limit = 20;

  const { data, loading, refetch } = useQuery(LIST_LEADS, {
    variables: {
      page,
      limit,
      type: typeFilter ?? undefined,
      status: statusFilter ?? undefined,
    },
    pollInterval: 30000,
  });

  const items: Lead[] = data?.adminLeads?.items ?? [];
  const total = data?.adminLeads?.total ?? 0;
  const newCount = data?.adminLeads?.newCount ?? 0;
  const contactedCount = data?.adminLeads?.contactedCount ?? 0;
  const pages = Math.max(1, Math.ceil(total / limit));

  return (
    <div>
      <Topbar
        title="صندوق Leads"
        subtitle={`${newCount} جديد · ${contactedCount} تم التواصل`}
      />

      <div className="p-6 space-y-5">
        {/* Type filter chips */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => {
              setTypeFilter(null);
              setPage(1);
            }}
            className={`px-3 py-1.5 rounded-full text-xs font-bold ${
              !typeFilter
                ? 'bg-hancr-violet text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            كل الأنواع
          </button>
          {Object.entries(TYPE_META).map(([key, m]) => (
            <button
              key={key}
              onClick={() => {
                setTypeFilter(key);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-full text-xs font-bold ${
                typeFilter === key
                  ? 'bg-hancr-violet text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>

        {/* Status filter chips */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => {
              setStatusFilter(null);
              setPage(1);
            }}
            className={`px-3 py-1.5 rounded-full text-xs font-bold ${
              !statusFilter
                ? 'bg-hancr-violet text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            كل الحالات ({total})
          </button>
          {Object.entries(STATUS_META).map(([key, m]) => (
            <button
              key={key}
              onClick={() => {
                setStatusFilter(key);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-full text-xs font-bold ${
                statusFilter === key
                  ? 'bg-hancr-violet text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>

        {/* List */}
        {loading ? (
          <div className="card p-12 text-center text-gray-400">جارٍ التحميل…</div>
        ) : items.length === 0 ? (
          <div className="card p-12 text-center text-gray-400">
            <HelpCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>لا توجد leads</p>
          </div>
        ) : (
          <div className="space-y-2">
            {items.map((l) => {
              const type = TYPE_META[l.type] ?? TYPE_META.contact;
              const status = STATUS_META[l.status] ?? STATUS_META.new;
              const TypeIcon = type.icon;
              return (
                <button
                  key={l.id}
                  onClick={() => setSelected(l)}
                  className="w-full text-start card p-4 hover:border-hancr-violet/40 hover:shadow-md transition-all"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`flex items-center justify-center w-10 h-10 rounded-xl shrink-0 ${type.color}`}
                    >
                      <TypeIcon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-bold text-gray-900">{l.name}</span>
                        <span className={`badge ${status.badge} text-[10px]`}>
                          {status.label}
                        </span>
                        <span className="text-xs text-gray-400">·</span>
                        <span className="text-xs text-gray-500">{type.label}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-500 mb-1">
                        <span className="inline-flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {l.email}
                        </span>
                        {l.phone ? (
                          <span className="inline-flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {l.phone}
                          </span>
                        ) : null}
                        {l.city ? (
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {l.city}
                          </span>
                        ) : null}
                      </div>
                      {l.message ? (
                        <p className="text-sm text-gray-600 line-clamp-1">
                          {l.message}
                        </p>
                      ) : null}
                      <div className="text-[10px] text-gray-400 mt-1">
                        {formatDate(l.createdAt)}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {pages > 1 ? (
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              {items.length} من {total}
            </p>
            <div className="flex items-center gap-1.5">
              <button
                className="btn-icon"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <span className="px-4 py-1.5 text-sm font-bold text-gray-700 bg-gray-50 rounded-lg">
                {page} / {pages}
              </span>
              <button
                className="btn-icon"
                disabled={page >= pages}
                onClick={() => setPage((p) => p + 1)}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : null}
      </div>

      {selected !== null && (
        <LeadDetailDrawer
          lead={selected}
          onClose={() => {
            setSelected(null);
            refetch();
          }}
        />
      )}
    </div>
  );
}

function LeadDetailDrawer({
  lead,
  onClose,
}: {
  lead: Lead;
  onClose: () => void;
}) {
  const [update, { loading: updating }] = useMutation(UPDATE_LEAD_STATUS, {
    onCompleted: () => {
      toast.success('تم التحديث');
      onClose();
    },
    onError: (e) => toast.error(e.message),
  });
  const [note, setNote] = useState('');

  const type = TYPE_META[lead.type] ?? TYPE_META.contact;
  const status = STATUS_META[lead.status] ?? STATUS_META.new;
  const TypeIcon = type.icon;
  const isOpen = lead.status === 'new' || lead.status === 'contacted';

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-end bg-black/50"
      onClick={onClose}
    >
      <div
        className="bg-white w-full sm:w-[560px] h-full overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b border-gray-200 p-5 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div
              className={`flex items-center justify-center w-10 h-10 rounded-xl ${type.color}`}
            >
              <TypeIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-gray-500">Lead #{lead.id}</div>
              <h2 className="font-extrabold text-gray-900 text-lg">{lead.name}</h2>
            </div>
          </div>
          <button onClick={onClose} className="btn-icon">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          <div className="card p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className={`badge ${status.badge}`}>{status.label}</span>
              <span className="text-xs text-gray-400">
                {formatDate(lead.createdAt)}
              </span>
            </div>
            <div className="text-sm text-gray-600">{type.label}</div>
            <div className="mt-3 pt-3 border-t border-gray-100 space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-gray-400" />
                <a
                  href={`mailto:${lead.email}`}
                  className="text-hancr-violet hover:underline"
                >
                  {lead.email}
                </a>
              </div>
              {lead.phone ? (
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <a
                    href={`tel:${lead.phone}`}
                    className="text-hancr-violet hover:underline"
                  >
                    {lead.phone}
                  </a>
                </div>
              ) : null}
              {lead.company ? (
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-gray-400" />
                  {lead.company}
                </div>
              ) : null}
              {lead.city ? (
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  {lead.city}
                </div>
              ) : null}
            </div>
            {lead.message ? (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <div className="text-xs text-gray-500 mb-1">الرسالة</div>
                <p className="text-sm text-gray-800 whitespace-pre-wrap">
                  {lead.message}
                </p>
              </div>
            ) : null}
          </div>

          {isOpen && (
            <div className="card p-4 space-y-3">
              <h3 className="font-bold text-gray-900 text-sm">تحديث الحالة</h3>
              <div>
                <label className="label">ملاحظة (اختياري)</label>
                <textarea
                  className="input"
                  rows={2}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="…"
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                {lead.status === 'new' && (
                  <button
                    disabled={updating}
                    onClick={() =>
                      update({
                        variables: {
                          input: {
                            leadId: lead.id,
                            status: 'contacted',
                            note: note || undefined,
                          },
                        },
                      })
                    }
                    className="btn-sm btn-outline col-span-3"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    تم التواصل
                  </button>
                )}
                <button
                  disabled={updating}
                  onClick={() =>
                    update({
                      variables: {
                        input: {
                          leadId: lead.id,
                          status: 'qualified',
                          note: note || undefined,
                        },
                      },
                    })
                  }
                  className="btn-sm btn-success col-span-2"
                >
                  مؤهَّل
                </button>
                <button
                  disabled={updating}
                  onClick={() =>
                    update({
                      variables: {
                        input: {
                          leadId: lead.id,
                          status: 'rejected',
                          note: note || undefined,
                        },
                      },
                    })
                  }
                  className="btn-sm btn-outline text-red-600"
                >
                  رفض
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
