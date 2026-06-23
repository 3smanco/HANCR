const MIN_VISIBLE_EDGE = 2;

function maskMiddle(value: string, visibleStart: number, visibleEnd: number): string {
  if (value.length <= visibleStart + visibleEnd) {
    return '*'.repeat(value.length);
  }

  return `${value.slice(0, visibleStart)}***${value.slice(-visibleEnd)}`;
}

export function maskPhoneNumber(phone: string | null | undefined): string {
  if (!phone) return '[missing-phone]';

  const normalized = phone.trim();
  if (!normalized) return '[missing-phone]';

  const prefix = normalized.startsWith('+') ? '+' : '';
  const digits = normalized.replace(/\D/g, '');

  if (digits.length <= 4) {
    return `${prefix}${'*'.repeat(Math.max(digits.length, 1))}`;
  }

  return `${prefix}${maskMiddle(digits, MIN_VISIBLE_EDGE, 2)}`;
}

export function maskEmail(email: string | null | undefined): string {
  if (!email) return '[missing-email]';

  const normalized = email.trim().toLowerCase();
  if (!normalized) return '[missing-email]';

  const [localPart, domain] = normalized.split('@');
  if (!localPart || !domain) {
    return maskMiddle(normalized, 1, 1);
  }

  const maskedLocal =
    localPart.length <= 2
      ? `${localPart[0] ?? '*'}***`
      : maskMiddle(localPart, 1, 1);

  const [domainName, ...suffixParts] = domain.split('.');
  const suffix = suffixParts.length ? `.${suffixParts.join('.')}` : '';
  const maskedDomain =
    domainName.length <= 2
      ? `${domainName[0] ?? '*'}***`
      : maskMiddle(domainName, 1, 1);

  return `${maskedLocal}@${maskedDomain}${suffix}`;
}
