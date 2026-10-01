import { canonicalBank } from './banks';

describe('canonicalBank', () => {
  it('maps disclosure names to the app bank names', () => {
    expect(canonicalBank('농협은행주식회사')).toBe('NH농협은행');
    expect(canonicalBank('중소기업은행')).toBe('IBK기업은행');
    expect(canonicalBank('주식회사 카카오뱅크')).toBe('카카오뱅크');
    expect(canonicalBank('한국스탠다드차타드은행')).toBe('SC제일은행');
    expect(canonicalBank('신한은행')).toBe('신한은행');
    expect(canonicalBank('(주)SBI저축은행')).toBe('SBI저축은행');
  });
});
