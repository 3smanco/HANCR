/** علم دولة + اسم/رمز اختياري — للشريط العلوي والجداول. */
export function CountryFlag({
  flag,
  iso2,
  name,
  size = 18,
  className = '',
}: {
  flag?: string | null;
  iso2?: string | null;
  name?: string | null;
  size?: number;
  className?: string;
}) {
  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`}>
      <span style={{ fontSize: size, lineHeight: 1 }} aria-hidden>
        {flag || '🏳️'}
      </span>
      {name ? (
        <span className="cmd-text text-sm">{name}</span>
      ) : iso2 ? (
        <span className="cmd-muted text-xs font-medium">{iso2}</span>
      ) : null}
    </span>
  );
}
