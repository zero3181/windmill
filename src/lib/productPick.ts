/** 금리 비교에서 고른 상품. 가입 페이지가 은행·상품명·금리를 채우는 데 쓴다. */
export interface ProductPick {
  bank: string;
  name: string;
  rate: number;
  termMonths: number;
}

type Listener = (pick: ProductPick) => void;

let listener: Listener | null = null;

/**
 * 가입 페이지가 열려 있는 동안 상품 선택을 기다린다. 가입 페이지 위에 띄운 금리 비교에서
 * 상품을 고르면 pickProduct가 이 리스너를 부른다. 반환값을 호출하면 기다림을 그친다.
 */
export function onProductPick(next: Listener): () => void {
  listener = next;
  return () => {
    if (listener === next) listener = null;
  };
}

export function pickProduct(pick: ProductPick): void {
  listener?.(pick);
}
