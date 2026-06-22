'use client';

import { useState, useRef, useCallback, type FC, type ReactNode } from 'react';
import { useQuery, useMutation, useSubscription } from '@apollo/client';
import {
  GoogleMap as GoogleMapComponent,
  MarkerF,
  useJsApiLoader,
  type GoogleMapProps,
} from '@react-google-maps/api';
import { AlertTriangle, MapPin, Phone, CheckCircle, Shield, Clock, X, Globe2, Volume2 } from 'lucide-react';
import {
  SOS_INCIDENTS,
  RESOLVE_SOS,
  ESCALATE_SOS,
  GLOBAL_SOS_CENTER,
  SOS_INCIDENT_CREATED_SUB,
  SOS_LOCATION_UPDATED_SUB,
} from '@/lib/gql';
import { Topbar } from '@/components/layout/Topbar';

const GoogleMap = GoogleMapComponent as unknown as FC<
  GoogleMapProps & { children?: ReactNode }
>;
const MAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY ?? '';

type SosStatus = 'Active' | 'Resolved' | 'Cancelled' | 'Escalated';

interface SosIncident {
  id: number;
  triggeredBy: 'Rider' | 'Driver' | 'System';
  triggeredById: number;
  orderId?: number;
  latitude: number;
  longitude: number;
  lastLatitude?: number;
  lastLongitude?: number;
  status: SosStatus;
  adminNote?: string;
  contactsNotified: number;
  policeNotified: boolean;
  createdAt: string;
  resolvedAt?: string;
}

const STATUS_FILTERS: { label: string; value: SosStatus[] | undefined }[] = [
  { label: 'النشطة فقط', value: ['Active'] },
  { label: 'كل الحوادث', value: undefined },
  { label: 'المُغلقة', value: ['Resolved', 'Cancelled'] },
  { label: 'المُصعَّدة', value: ['Escalated'] },
];

export default function SosDashboardPage() {
  const [filterIdx, setFilterIdx] = useState(0);
  const [selected, setSelected] = useState<SosIncident | null>(null);

  const { data, loading, error, refetch } = useQuery(SOS_INCIDENTS, {
    variables: { statuses: STATUS_FILTERS[filterIdx].value, limit: 100 },
    pollInterval: 30000, // احتياط — الدفع الفوري عبر الاشتراك أدناه
  });

  const incidents: SosIncident[] = data?.sosIncidents ?? [];
  const activeCount: number = data?.activeSosCount ?? 0;

  // ─── الزمن الحقيقي: تنبيه فوري + خريطة حيّة ───
  const [liveLocs, setLiveLocs] = useState<Record<number, { lat: number; lng: number }>>({});
  const [flash, setFlash] = useState(false);
  const [soundOn, setSoundOn] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const playAlarm = useCallback(() => {
    if (!soundOn) return;
    try {
      audioCtxRef.current ??= new (window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext)();
      const ctx = audioCtxRef.current;
      // نغمة إنذار مزدوجة قصيرة
      [0, 0.35].forEach((t) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'square';
        osc.frequency.value = 880;
        gain.gain.value = 0.12;
        osc.connect(gain).connect(ctx.destination);
        osc.start(ctx.currentTime + t);
        osc.stop(ctx.currentTime + t + 0.25);
      });
    } catch {
      /* تجاهل */
    }
  }, [soundOn]);

  // حادثة جديدة → وميض + صوت + إعادة جلب فورية
  useSubscription(SOS_INCIDENT_CREATED_SUB, {
    onData: () => {
      setFlash(true);
      playAlarm();
      refetch();
      setTimeout(() => setFlash(false), 6000);
    },
  });

  // تحديث موقع حيّ → حرّك الماركر فوراً
  useSubscription(SOS_LOCATION_UPDATED_SUB, {
    onData: ({ data: d }) => {
      const u = d.data?.sosLocationUpdated as
        | { incidentId: number; latitude: number; longitude: number }
        | undefined;
      if (u) {
        setLiveLocs((prev) => ({
          ...prev,
          [u.incidentId]: { lat: u.latitude, lng: u.longitude },
        }));
      }
    },
  });

  const activeIncidents = incidents.filter((i) => i.status === 'Active' || i.status === 'Escalated');

  return (
    <div
      className={`flex flex-col h-screen bg-gray-50 transition-colors ${
        flash ? 'ring-4 ring-red-500 ring-inset animate-pulse' : ''
      }`}
    >
      <Topbar title="مركز الطوارئ (SOS)" />

      {flash && (
        <div className="bg-red-600 text-white px-6 py-3 font-bold flex items-center gap-2 animate-pulse">
          <AlertTriangle className="w-5 h-5" />
          🚨 حادثة طوارئ جديدة — راجع القائمة فوراً
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-6">
        {/* تفعيل الصوت (سياسة المتصفّح تتطلّب تفاعلاً) + الخريطة الحيّة */}
        {!soundOn && (
          <button
            onClick={() => setSoundOn(true)}
            className="mb-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-amber-100 text-amber-800 hover:bg-amber-200"
          >
            <Volume2 className="w-4 h-4" /> تفعيل التنبيه الصوتي
          </button>
        )}
        <LiveSosMap incidents={activeIncidents} liveLocs={liveLocs} />
        {/* ─── Top stats ─── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-2xl p-5 border border-red-100 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-red-100 rounded-xl">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">حوادث نشطة</p>
                <p className="text-3xl font-bold text-red-600">{activeCount}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-amber-100 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-amber-100 rounded-xl">
                <Shield className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">مُصعَّدة للشرطة</p>
                <p className="text-3xl font-bold text-amber-700">
                  {incidents.filter((i) => i.policeNotified).length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-emerald-100 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-emerald-100 rounded-xl">
                <CheckCircle className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">مُغلقة آمناً</p>
                <p className="text-3xl font-bold text-emerald-700">
                  {incidents.filter((i) => i.status === 'Resolved' || i.status === 'Cancelled').length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ─── Global SOS center (Phase 9) ─── */}
        <GlobalSosStrip />

        {/* ─── Filter tabs ─── */}
        <div className="flex gap-2 mb-4 flex-wrap">
          {STATUS_FILTERS.map((f, idx) => (
            <button
              key={f.label}
              onClick={() => setFilterIdx(idx)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${
                filterIdx === idx
                  ? 'bg-red-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-100'
              }`}
            >
              {f.label}
            </button>
          ))}
          <button
            onClick={() => refetch()}
            className="px-4 py-2 rounded-xl text-sm font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200 transition"
          >
            تحديث
          </button>
        </div>

        {/* ─── List ─── */}
        {loading && incidents.length === 0 && (
          <div className="text-center py-12 text-gray-500">جاري التحميل...</div>
        )}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700">
            خطأ: {error.message}
          </div>
        )}
        {!loading && incidents.length === 0 && (
          <div className="bg-white rounded-2xl p-12 text-center border border-gray-200">
            <Shield className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">لا توجد حوادث في هذه الفئة</p>
          </div>
        )}
        <div className="space-y-3">
          {incidents.map((inc) => (
            <IncidentRow
              key={inc.id}
              incident={inc}
              onClick={() => setSelected(inc)}
            />
          ))}
        </div>
      </div>

      {/* ─── Details modal ─── */}
      {selected && (
        <IncidentDetails
          incident={selected}
          onClose={() => setSelected(null)}
          onRefresh={refetch}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Global SOS center strip (Phase 9) — per-country + sovereign emergency numbers
// ─────────────────────────────────────────────────────────────────────────────

type SosCountry = {
  countryIso?: string | null;
  countryName?: string | null;
  flag?: string | null;
  emergencyNumber?: string | null;
  activeCount: number;
};

function GlobalSosStrip() {
  const { data } = useQuery(GLOBAL_SOS_CENTER, { pollInterval: 10000 });
  const center = data?.globalSosCenter;
  if (!center || center.totalActive === 0) return null;

  return (
    <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm mb-6">
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <Globe2 className="w-5 h-5 text-hancr-violet" />
        <span className="font-bold text-gray-900">مركز SOS العالمي</span>
        <span className="text-xs text-gray-400">
          توزيع الحوادث النشطة حسب الدولة + رقم الطوارئ السيادي
        </span>
        {center.criticalCount > 0 && (
          <span className="mr-auto text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-bold">
            {center.criticalCount} حرجة
          </span>
        )}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {(center.byCountry as SosCountry[]).map((c, i) => (
          <div
            key={c.countryIso ?? `unknown-${i}`}
            className="border border-gray-100 rounded-xl p-3 flex items-center gap-3"
          >
            <div className="text-2xl shrink-0">{c.flag ?? '🏳️'}</div>
            <div className="min-w-0">
              <div className="font-bold text-gray-900 truncate">
                {c.countryName ?? 'غير محدَّد'}
              </div>
              <div className="text-xs text-gray-500 flex items-center gap-2">
                <span className="text-red-600 font-bold">
                  {c.activeCount} نشطة
                </span>
                {c.emergencyNumber && (
                  <span className="inline-flex items-center gap-0.5 text-emerald-700">
                    <Phone className="w-3 h-3" />
                    {c.emergencyNumber}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Incident Row
// ─────────────────────────────────────────────────────────────────────────────

function IncidentRow({
  incident,
  onClick,
}: {
  incident: SosIncident;
  onClick: () => void;
}) {
  const statusColor = {
    Active: 'bg-red-100 text-red-700 border-red-300',
    Escalated: 'bg-amber-100 text-amber-700 border-amber-300',
    Resolved: 'bg-emerald-100 text-emerald-700 border-emerald-300',
    Cancelled: 'bg-gray-100 text-gray-700 border-gray-300',
  }[incident.status];

  const statusLabel = {
    Active: 'نشطة',
    Escalated: 'مُصعَّدة',
    Resolved: 'مُغلقة',
    Cancelled: 'مُلغاة',
  }[incident.status];

  const timeSince = Math.floor(
    (Date.now() - new Date(incident.createdAt).getTime()) / 60000,
  );

  return (
    <button
      onClick={onClick}
      className="w-full bg-white rounded-2xl border border-gray-200 p-4 hover:shadow-md transition text-right"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span
              className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold border ${statusColor}`}
            >
              {statusLabel}
            </span>
            <span className="text-xs text-gray-500 font-mono">
              #{incident.id}
            </span>
            {incident.policeNotified && (
              <span className="inline-flex items-center gap-1 text-xs text-amber-700 font-semibold">
                <Shield className="w-3 h-3" />
                الشرطة مُبلَّغة
              </span>
            )}
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-600 mb-1">
            <span className="font-semibold">
              {incident.triggeredBy === 'Rider' ? 'راكب' : 'سائق'} #
              {incident.triggeredById}
            </span>
            {incident.orderId && (
              <span className="text-gray-500">رحلة #{incident.orderId}</span>
            )}
            <span className="flex items-center gap-1 text-gray-500">
              <Phone className="w-3 h-3" />
              {incident.contactsNotified} جهة مُبلَّغة
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <MapPin className="w-3 h-3" />
            {incident.lastLatitude?.toFixed(4) ?? incident.latitude.toFixed(4)},{' '}
            {incident.lastLongitude?.toFixed(4) ?? incident.longitude.toFixed(4)}
          </div>
        </div>
        <div className="text-left flex-shrink-0">
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Clock className="w-3 h-3" />
            {timeSince < 60 ? `قبل ${timeSince} د` : `قبل ${Math.floor(timeSince / 60)} س`}
          </div>
        </div>
      </div>
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Details Modal
// ─────────────────────────────────────────────────────────────────────────────

function IncidentDetails({
  incident,
  onClose,
  onRefresh,
}: {
  incident: SosIncident;
  onClose: () => void;
  onRefresh: () => void;
}) {
  const [adminNote, setAdminNote] = useState(incident.adminNote ?? '');
  const [markPolice, setMarkPolice] = useState(false);

  const [resolveMutation, { loading: resolving }] = useMutation(RESOLVE_SOS, {
    onCompleted: () => {
      onRefresh();
      onClose();
    },
  });

  const [escalateMutation, { loading: escalating }] = useMutation(ESCALATE_SOS, {
    onCompleted: () => {
      onRefresh();
      onClose();
    },
  });

  const mapUrl = `https://maps.google.com/?q=${incident.lastLatitude ?? incident.latitude},${incident.lastLongitude ?? incident.longitude}`;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between p-6 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-bold mb-1">
              حادثة #{incident.id} — {incident.triggeredBy === 'Rider' ? 'راكب' : 'سائق'} #
              {incident.triggeredById}
            </h2>
            <p className="text-sm text-gray-500">
              {new Date(incident.createdAt).toLocaleString('ar')}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Location */}
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-2">الموقع</p>
            <a
              href={mapUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block bg-blue-50 border border-blue-200 rounded-xl p-3 hover:bg-blue-100 transition"
            >
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-blue-600" />
                <span className="text-blue-700 font-mono text-sm">
                  {(incident.lastLatitude ?? incident.latitude).toFixed(6)},{' '}
                  {(incident.lastLongitude ?? incident.longitude).toFixed(6)}
                </span>
                <span className="text-xs text-blue-600 ml-auto">
                  افتح في Google Maps ↗
                </span>
              </div>
            </a>
          </div>

          {/* Meta */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-gray-500 text-xs mb-1">جهات مُبلَّغة</p>
              <p className="font-bold text-lg">{incident.contactsNotified}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-gray-500 text-xs mb-1">رقم الرحلة</p>
              <p className="font-bold text-lg">
                {incident.orderId ? `#${incident.orderId}` : '—'}
              </p>
            </div>
          </div>

          {incident.adminNote && (
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-2">
                ملاحظة سابقة
              </p>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm">
                {incident.adminNote}
              </div>
            </div>
          )}

          {incident.status === 'Active' && (
            <>
              <div>
                <label
                  htmlFor="admin-note"
                  className="block text-sm font-semibold text-gray-700 mb-2"
                >
                  ملاحظة الأدمن
                </label>
                <textarea
                  id="admin-note"
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  rows={3}
                  className="w-full border border-gray-300 rounded-xl p-3 text-sm"
                  placeholder="تفاصيل المتابعة، تواصل مع الشرطة، الخ..."
                />
              </div>

              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={markPolice}
                  onChange={(e) => setMarkPolice(e.target.checked)}
                  className="rounded"
                />
                تم إبلاغ الشرطة
              </label>

              <div className="flex gap-3 pt-4 border-t border-gray-100">
                <button
                  onClick={() =>
                    resolveMutation({
                      variables: {
                        input: {
                          incidentId: incident.id,
                          adminNote: adminNote || undefined,
                          markPoliceNotified: markPolice,
                        },
                      },
                    })
                  }
                  disabled={resolving}
                  className="flex-1 bg-emerald-600 text-white px-4 py-3 rounded-xl font-semibold hover:bg-emerald-700 disabled:opacity-50 transition"
                >
                  {resolving ? 'جاري الإغلاق...' : '✓ إغلاق الحادثة'}
                </button>
                <button
                  onClick={() =>
                    escalateMutation({
                      variables: {
                        incidentId: incident.id,
                        adminNote: adminNote || 'تم التصعيد للشرطة',
                      },
                    })
                  }
                  disabled={escalating || !adminNote.trim()}
                  className="flex-1 bg-amber-600 text-white px-4 py-3 rounded-xl font-semibold hover:bg-amber-700 disabled:opacity-50 transition"
                >
                  {escalating ? 'جاري التصعيد...' : '⚠ تصعيد للشرطة'}
                </button>
              </div>
            </>
          )}

          {incident.status !== 'Active' && (
            <div className="text-center py-4 text-gray-500 text-sm">
              تم إغلاق هذه الحادثة في{' '}
              {incident.resolvedAt
                ? new Date(incident.resolvedAt).toLocaleString('ar')
                : '—'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── الخريطة الحيّة لحوادث الطوارئ النشطة ───
function LiveSosMap({
  incidents,
  liveLocs,
}: {
  incidents: SosIncident[];
  liveLocs: Record<number, { lat: number; lng: number }>;
}) {
  const { isLoaded } = useJsApiLoader({
    id: 'hancr-maps',
    googleMapsApiKey: MAPS_KEY,
  });

  const points = incidents.map((i) => {
    const live = liveLocs[i.id];
    return {
      id: i.id,
      lat: live?.lat ?? i.lastLatitude ?? i.latitude,
      lng: live?.lng ?? i.lastLongitude ?? i.longitude,
      who: i.triggeredBy,
    };
  });

  if (incidents.length === 0) return null;
  if (!MAPS_KEY || !isLoaded) {
    return (
      <div className="mb-6 bg-white rounded-2xl p-8 border border-gray-200 text-center text-gray-400">
        خريطة التتبّع الحيّ — {points.length} حادثة نشطة
      </div>
    );
  }

  const center = { lat: points[0].lat, lng: points[0].lng };
  return (
    <div className="mb-6 rounded-2xl overflow-hidden border border-red-200 shadow-sm">
      <GoogleMap
        mapContainerStyle={{ width: '100%', height: '320px' }}
        center={center}
        zoom={12}
        options={{ streetViewControl: false, mapTypeControl: false }}
      >
        {points.map((p) => (
          <MarkerF
            key={p.id}
            position={{ lat: p.lat, lng: p.lng }}
            label={{ text: `#${p.id}`, color: '#fff', fontSize: '11px' }}
          />
        ))}
      </GoogleMap>
    </div>
  );
}
