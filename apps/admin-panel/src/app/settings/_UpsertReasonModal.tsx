'use client';

import { useState } from 'react';
import { X } from 'lucide-react';

type ReasonLike = Record<string, unknown>;

export function UpsertReasonModal({
  initial,
  isParam,
  saving,
  onClose,
  onSave,
}: {
  initial: ReasonLike | null;
  isParam: boolean;
  saving: boolean;
  onClose: () => void;
  onSave: (input: Record<string, unknown>) => void;
}) {
  const [code, setCode] = useState((initial?.code as string) ?? '');
  const [labelAr, setLabelAr] = useState((initial?.labelAr as string) ?? '');
  const [labelEn, setLabelEn] = useState((initial?.labelEn as string) ?? '');
  const [appliesTo, setAppliesTo] = useState(
    ((initial?.appliesTo as string) ?? (initial?.target as string)) ??
      (isParam ? 'driver' : 'rider'),
  );
  const [sortOrder, setSortOrder] = useState(
    String((initial?.sortOrder as number) ?? 0),
  );
  const [active, setActive] = useState((initial?.active as boolean) ?? true);

  const options = isParam
    ? [
        { value: 'driver', label: 'تقييم السائق' },
        { value: 'rider', label: 'تقييم الراكب' },
      ]
    : [
        { value: 'rider', label: 'الراكب' },
        { value: 'driver', label: 'السائق' },
        { value: 'both', label: 'الاثنان' },
      ];

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
          <h2 className="font-extrabold text-gray-900 text-lg">
            {initial ? 'تعديل' : 'إضافة'} {isParam ? 'معيار' : 'سبب'}
          </h2>
          <button onClick={onClose} className="btn-icon">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="label">الكود</label>
            <input
              className="input"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              disabled={!!initial}
            />
          </div>
          <div>
            <label className="label">بالعربية</label>
            <input
              className="input"
              value={labelAr}
              onChange={(e) => setLabelAr(e.target.value)}
            />
          </div>
          <div>
            <label className="label">بالإنجليزية</label>
            <input
              className="input"
              value={labelEn}
              onChange={(e) => setLabelEn(e.target.value)}
            />
          </div>
          <div>
            <label className="label">{isParam ? 'الهدف' : 'يظهر لـ'}</label>
            <select
              className="input"
              value={appliesTo}
              onChange={(e) => setAppliesTo(e.target.value)}
            >
              {options.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">الترتيب</label>
            <input
              type="number"
              className="input"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
            />
            <span>نشط</span>
          </label>
        </div>

        <div className="flex gap-2 mt-6">
          <button onClick={onClose} className="btn-outline flex-1">
            إلغاء
          </button>
          <button
            disabled={saving || !code || !labelAr || !labelEn}
            onClick={() => {
              const base = {
                id: initial?.id,
                code: code.trim(),
                labelAr: labelAr.trim(),
                labelEn: labelEn.trim(),
                sortOrder: Number(sortOrder) || 0,
                active,
              };
              const payload = isParam
                ? { ...base, target: appliesTo }
                : { ...base, appliesTo };
              onSave(payload);
            }}
            className="btn-primary flex-1"
          >
            {saving ? 'جارٍ...' : 'حفظ'}
          </button>
        </div>
      </div>
    </div>
  );
}
