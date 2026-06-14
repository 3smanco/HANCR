import { describe, it, expect } from '@jest/globals';
import { classifyExpiry } from './fleet-ops.service';

describe('classifyExpiry', () => {
  it('expired للأيام السالبة', () => {
    expect(classifyExpiry(-1)).toBe('expired');
    expect(classifyExpiry(-100)).toBe('expired');
  });

  it('critical عند ≤7 أيام', () => {
    expect(classifyExpiry(0)).toBe('critical');
    expect(classifyExpiry(7)).toBe('critical');
  });

  it('soon لما بعد 7 أيام', () => {
    expect(classifyExpiry(8)).toBe('soon');
    expect(classifyExpiry(30)).toBe('soon');
  });
});
