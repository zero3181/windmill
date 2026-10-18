import { bladeMonths, bladePosition } from './blades';

const TODAY = '2026-10-18';

/** 만기월 m(1~12)이 붙은 자리에 실제로 m이라는 이름이 붙는지 확인할 때 쓴다. */
function labelOf(months: number[], month: number, blades: number): number {
  return months[bladePosition(`2026-${String(month).padStart(2, '0')}-10`, blades)];
}

const sorted = (months: number[]) => [...months].sort((a, b) => a - b);

describe('bladeMonths', () => {
  it('12날개는 자리와 달이 하나씩 맞는다', () => {
    expect(bladeMonths(['2027-03-10'], 12, TODAY)).toEqual([12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
  });

  it('6날개, 2~7월 만기면 2~7월로 부른다', () => {
    const dates = ['2027-02-10', '2027-03-10', '2027-04-10', '2027-05-10', '2027-06-10', '2027-07-10'];
    const months = bladeMonths(dates, 6, TODAY);
    expect(sorted(months)).toEqual([2, 3, 4, 5, 6, 7]);
    for (const m of [2, 3, 4, 5, 6, 7]) expect(labelOf(months, m, 6)).toBe(m);
  });

  it('6날개, 일부만 채웠으면 가장 이른 만기월부터 이어 부른다 (2·3·4월 → 2~7월)', () => {
    const months = bladeMonths(['2027-02-10', '2027-03-10', '2027-04-10'], 6, TODAY);
    expect(sorted(months)).toEqual([2, 3, 4, 5, 6, 7]);
  });

  it('만기가 6개월보다 넓게 퍼져 있으면 가장 많이 들어가는 구간을 고른다', () => {
    // 3~9월 만기 + 12월: 3~8월과 4~9월이 6개로 가장 많다. 먼저 돌아오는 3월부터.
    const dates = [
      '2027-03-10',
      '2027-04-10',
      '2027-05-10',
      '2027-06-10',
      '2027-07-10',
      '2027-08-10',
      '2027-09-10',
      '2026-12-10',
    ];
    expect(sorted(bladeMonths(dates, 6, TODAY))).toEqual([3, 4, 5, 6, 7, 8]);
  });

  it('구간에 더 많이 들어가면 늦게 시작해도 그쪽을 고른다', () => {
    // 12월 하나와 5~9월 다섯: 5~10월 구간(5개)이 12월 시작(12~5월, 2개)보다 많다.
    const dates = ['2026-12-10', '2027-05-10', '2027-06-10', '2027-07-10', '2027-08-10', '2027-09-10'];
    expect(sorted(bladeMonths(dates, 6, TODAY))).toEqual([5, 6, 7, 8, 9, 10]);
  });

  it('만기가 없으면 지금 가입했을 때의 만기월부터 부른다 (10월 → 4~9월)', () => {
    expect(sorted(bladeMonths([], 6, TODAY))).toEqual([4, 5, 6, 7, 8, 9]);
  });
});
