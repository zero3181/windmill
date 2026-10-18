import { addMonthsClamped, compareISODates, parseISODate, type ISODate } from './calc';

/**
 * 풍차 날개 자리. 날개 하나가 달 하나를 뜻하고, 시계처럼 12시 방향부터 돈다.
 * 12날개면 12월=0(12시 방향), 1월=1, … 11월=11. 6날개면 6·12월=0, 1·7월=1 …
 */
export function bladePosition(date: string, blades: number): number {
  return Number(date.slice(5, 7)) % blades;
}

/** 모든 자리가 채워진 풍차 (미리보기용) */
export function allBlades(blades: number): number[] {
  return Array.from({ length: blades }, (_, i) => i);
}

/** 날개 자리가 뜻하는 달 (1~12). 이름을 정해 주지 않으면 6날개는 앞쪽 반년(1~6월)으로 부른다. */
export function bladeMonth(position: number, blades: number): number {
  return position === 0 ? blades : position;
}

/**
 * 날개 자리마다 붙일 달 이름 (자리 순서대로 1~12).
 * 12날개는 자리와 달이 하나씩 맞는다. 6날개는 한 자리가 두 달(예: 2·8월)을 뜻하므로, 실제 만기월이
 * 가장 많이 들어가는 연속된 날개 수 개월(예: 2~7월)을 골라 그 달로 부른다. 같은 수면 가장 먼저 돌아오는
 * 만기월에서 시작하는 구간을 고른다(앞으로 가입할 계좌의 만기가 그 뒤로 이어진다). 만기가 없으면 지금
 * 가입했을 때의 만기월부터 부른다.
 */
export function bladeMonths(maturityDates: ISODate[], blades: number, today: ISODate): number[] {
  if (blades >= 12) return allBlades(blades).map((p) => bladeMonth(p, blades));
  const months = maturityDates.map((d) => parseISODate(d).m);
  // 시작 후보: 만기월을 이른 순서대로, 없으면 지금 가입했을 때의 만기월
  const starts = [...maturityDates].sort(compareISODates).map((d) => parseISODate(d).m);
  if (starts.length === 0) starts.push(parseISODate(addMonthsClamped(today, blades)).m);
  let bestStart = starts[0];
  let bestCount = -1;
  for (const start of starts) {
    const count = months.filter((m) => (m - start + 12) % 12 < blades).length;
    if (count > bestCount) {
      bestCount = count;
      bestStart = start;
    }
  }
  const labels = new Array<number>(blades);
  for (let k = 0; k < blades; k++) {
    const month = ((bestStart - 1 + k) % 12) + 1;
    labels[month % blades] = month;
  }
  return labels;
}

/**
 * 풍차에 들어가는 계좌인지. 날개 수만큼의 기간(6날개면 6개월)이어야
 * 만기가 날개 수 개월마다 같은 자리로 돌아와 풍차가 계속 돈다.
 */
export function fitsWindmill(account: { termMonths: number }, blades: number): boolean {
  return account.termMonths === blades;
}
