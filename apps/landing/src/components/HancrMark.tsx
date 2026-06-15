/**
 * شعار HANCR الجديد "HA + سهم صاعد" (مطابق لأيقونة التطبيقين).
 * يرسم مسارات العلامة فقط — الخلفية/الحدود يوفّرها العنصر الحاوي.
 * `idSuffix` يجعل معرّفات التدرّج فريدة عند وجود أكثر من نسخة في الصفحة (Header + Footer).
 */
export function HancrMark({
  className = 'w-full h-full',
  idSuffix = '',
}: {
  className?: string;
  idSuffix?: string;
}) {
  const ember = `ember${idSuffix}`;
  const gloss = `gloss${idSuffix}`;
  return (
    <svg viewBox="274 219 560 560" className={className} xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <defs>
        <linearGradient id={ember} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFB069" />
          <stop offset="0.5" stopColor="#FF7A1A" />
          <stop offset="1" stopColor="#E55F00" />
        </linearGradient>
        <linearGradient id={gloss} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.45" />
          <stop offset="0.45" stopColor="#ffffff" stopOpacity="0.05" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* H: left stem + crossbar + short right stem */}
      <rect x="288" y="360" width="78" height="336" rx="20" fill={`url(#${ember})`} />
      <rect x="342" y="492" width="132" height="66" rx="16" fill={`url(#${ember})`} />
      {/* A: clean triangle peak (two legs down) + crossbar */}
      <path d="M474 696 L560 378 L620 378 L534 696 Z" fill={`url(#${ember})`} />
      <path d="M566 378 L626 378 L712 696 L652 696 Z" fill={`url(#${ember})`} />
      <rect x="520" y="566" width="150" height="56" rx="14" fill={`url(#${ember})`} />
      {/* Rising arrow: bold diagonal + arrowhead */}
      <path d="M430 632 L726 372" fill="none" stroke="#FFB069" strokeWidth="62" strokeLinecap="round" />
      <path
        d="M648 360 L754 352 L742 458"
        fill="none"
        stroke="#FFB069"
        strokeWidth="62"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* thin pearl highlight along the arrow */}
      <path d="M430 632 L726 372" fill="none" stroke="#ffffff" strokeOpacity="0.35" strokeWidth="14" strokeLinecap="round" />
      {/* Gloss sheen on upright strokes */}
      <rect x="288" y="360" width="78" height="336" rx="20" fill={`url(#${gloss})`} />
      <path d="M474 696 L560 378 L620 378 L534 696 Z" fill={`url(#${gloss})`} />
      {/* Glint star at the arrow tip */}
      <g transform="translate(788 330)" fill="#FFF5EE">
        <path d="M0 -32 L6.5 -6.5 L32 0 L6.5 6.5 L0 32 L-6.5 6.5 L-32 0 L-6.5 -6.5 Z" />
      </g>
    </svg>
  );
}
