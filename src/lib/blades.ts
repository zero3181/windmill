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

/** 날개 자리가 뜻하는 달 (1~12). 6날개는 앞쪽 반년(1~6월)으로 이름 붙인다. */
export function bladeMonth(position: number, blades: number): number {
  return position === 0 ? blades : position;
}
