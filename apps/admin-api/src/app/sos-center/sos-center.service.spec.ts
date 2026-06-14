import { describe, it, expect } from '@jest/globals';
import { triageIncident } from './sos-center.service';

describe('triageIncident', () => {
  const live = { hasLiveLocation: true, policeNotified: false, status: 'Active' };

  it('critical — نشطة حديثة بلا إبلاغ شرطة', () => {
    expect(triageIncident({ ...live, ageMinutes: 5 })).toBe('critical');
  });

  it('critical — فقدان الموقع الحيّ أخطر دائماً', () => {
    expect(
      triageIncident({
        ageMinutes: 120,
        policeNotified: true,
        hasLiveLocation: false,
        status: 'Active',
      }),
    ).toBe('critical');
  });

  it('high — نشطة لكن أُبلغت الشرطة', () => {
    expect(
      triageIncident({ ...live, ageMinutes: 5, policeNotified: true }),
    ).toBe('high');
  });

  it('high — نشطة لكن أقدم من 15 دقيقة', () => {
    expect(triageIncident({ ...live, ageMinutes: 40 })).toBe('high');
  });

  it('normal — غير نشطة (مُصعَّدة/محلولة)', () => {
    expect(
      triageIncident({
        ageMinutes: 5,
        policeNotified: false,
        hasLiveLocation: true,
        status: 'Resolved',
      }),
    ).toBe('normal');
  });
});
