'use client';

import { useEffect, useMemo, useState } from 'react';

/** ساعة حيّة بتوقيت منطقة (IANA tz) — تظهر توقيت المدينة المراقَبة. */
export function TimeZoneClock({
  timezone,
  label,
  className = '',
  showSeconds = false,
}: {
  timezone: string;
  label?: string;
  className?: string;
  showSeconds?: boolean;
}) {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const time = useMemo(() => {
    if (!now) return '--:--';
    try {
      return new Intl.DateTimeFormat('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
        ...(showSeconds ? { second: '2-digit' } : {}),
        timeZone: timezone,
      }).format(now);
    } catch {
      return '--:--';
    }
  }, [now, timezone, showSeconds]);

  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`}>
      {label && <span className="cmd-muted text-xs">{label}</span>}
      <span className="cmd-text tabular-nums text-sm font-medium">{time}</span>
    </span>
  );
}
