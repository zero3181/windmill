import Storage from 'expo-sqlite/kv-store';
import type { AccountType } from '../types/account';

/**
 * 금융감독원 금융상품한눈에 오픈 API.
 * https://finlife.fss.or.kr/finlife/api/fncCoApi/list.do?menuNo=700051
 */
const API_BASE = 'https://finlife.fss.or.kr/finlifeapi';
const ENDPOINTS: Record<AccountType, string> = {
  savings: 'savingProductsSearch.json',
  deposit: 'depositProductsSearch.json',
};
/** 020000: 은행, 030300: 저축은행 */
const FIN_GROUPS = { '020000': 'bank', '030300': 'savingsBank' } as const;
// 기본 User-Agent로 요청하면 서버가 응답 없이 연결을 끊는다.
const USER_AGENT =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148';
const CACHE_TTL_MS = 12 * 60 * 60 * 1000;

export interface FinlifeBase {
  fin_co_no: string;
  fin_prdt_cd: string;
  kor_co_nm: string;
  fin_prdt_nm: string;
  join_way: string | null;
  spcl_cnd: string | null;
  join_deny: string;
  join_member: string | null;
  etc_note: string | null;
  max_limit: number | null;
  dcls_month: string;
}

export interface FinlifeOption {
  fin_co_no: string;
  fin_prdt_cd: string;
  intr_rate_type_nm: string;
  rsrv_type_nm?: string;
  save_trm: string;
  intr_rate: number | null;
  intr_rate2: number | null;
}

export interface FinProduct {
  id: string;
  company: string;
  name: string;
  group: (typeof FIN_GROUPS)[keyof typeof FIN_GROUPS];
  termMonths: number;
  /** 기본 금리 (연 %) */
  rate: number;
  /** 우대 조건을 모두 채웠을 때 최고 금리 (연 %) */
  maxRate: number;
  rateType: string;
  /** 적금만: 정액적립식 / 자유적립식 */
  reserveType?: string;
  specialCondition: string;
  joinMember: string;
  /** 공시상 가입제한 여부 (서민전용·일부제한) */
  restricted: boolean;
  joinWay: string;
  maxLimit: number | null;
  note: string;
  /** 공시 월 (YYYYMM) */
  disclosureMonth: string;
}

/** 공시 원본(기본정보 + 기간별 옵션)을 기간별 상품 행으로 펼친다. */
export function normalizeProducts(
  bases: (FinlifeBase & { group: FinProduct['group'] })[],
  options: FinlifeOption[]
): FinProduct[] {
  const byKey = new Map(bases.map((b) => [`${b.fin_co_no}:${b.fin_prdt_cd}`, b]));
  const products: FinProduct[] = [];
  for (const o of options) {
    const b = byKey.get(`${o.fin_co_no}:${o.fin_prdt_cd}`);
    if (!b || o.intr_rate == null) continue;
    products.push({
      id: `${b.fin_co_no}:${b.fin_prdt_cd}:${o.save_trm}:${o.rsrv_type_nm ?? ''}`,
      company: b.kor_co_nm,
      name: b.fin_prdt_nm.replace(/\s+/g, ' ').trim(),
      group: b.group,
      termMonths: Number(o.save_trm),
      rate: o.intr_rate,
      maxRate: Math.max(o.intr_rate, o.intr_rate2 ?? 0),
      rateType: o.intr_rate_type_nm,
      reserveType: o.rsrv_type_nm,
      specialCondition: (b.spcl_cnd ?? '').trim(),
      joinMember: (b.join_member ?? '').trim(),
      // join_deny: 1 제한없음, 2 서민전용, 3 일부제한
      restricted: b.join_deny !== '1',
      joinWay: b.join_way ?? '',
      maxLimit: b.max_limit,
      note: (b.etc_note ?? '').trim(),
      disclosureMonth: b.dcls_month,
    });
  }
  return products;
}

/**
 * 가입 대상에 특별한 조건(반려동물, 자녀, 수급자, 지역 사업자 등)이 없는지.
 * 공시의 join_deny가 '제한없음'이어도 가입대상 문구에 조건이 붙은 상품이 많아 문구로 한 번 더 거른다.
 */
const OPEN_MEMBER = /^(제한\s*없[음슴]|누구나.*|개인|개인\s*및\s*법인.*|실명의 개인.*|만\s*1[789]세\s*이상.*(개인|내국인|누구나).*|.*(인터넷|모바일|스마트|비대면).*(사용자|고객))$/;

export function isOpenToAnyone(p: FinProduct): boolean {
  return !p.restricted && OPEN_MEMBER.test(p.joinMember);
}

/** 영업점 없이 인터넷·스마트폰으로만 가입하는 상품인지. */
export function isOnlineOnly(p: FinProduct): boolean {
  return /스마트폰|인터넷/.test(p.joinWay) && !/영업점/.test(p.joinWay);
}

export interface RankOptions {
  termMonths: number;
  /** 이미 가입한 은행 등 제외할 금융회사 이름 */
  excludeCompanies?: string[];
  /** 누구나 가입할 수 있는 상품만 */
  openOnly?: boolean;
  /** 비대면 전용 상품만 */
  onlineOnly?: boolean;
}

/** 조건에 맞는 상품을 금융회사당 하나(기본 금리가 가장 높은 것)씩 골라 금리순으로. */
export function rankProducts(products: FinProduct[], options: RankOptions): FinProduct[] {
  const exclude = new Set(options.excludeCompanies ?? []);
  const bestByCompany = new Map<string, FinProduct>();
  for (const p of products) {
    if (p.termMonths !== options.termMonths) continue;
    if (exclude.has(p.company)) continue;
    if (options.openOnly && !isOpenToAnyone(p)) continue;
    if (options.onlineOnly && !isOnlineOnly(p)) continue;
    const current = bestByCompany.get(p.company);
    if (!current || p.rate > current.rate || (p.rate === current.rate && p.maxRate > current.maxRate)) {
      bestByCompany.set(p.company, p);
    }
  }
  return [...bestByCompany.values()].sort((a, b) => b.rate - a.rate || b.maxRate - a.maxRate);
}

async function fetchPage(type: AccountType, group: string, page: number, apiKey: string) {
  const url = `${API_BASE}/${ENDPOINTS[type]}?auth=${apiKey}&topFinGrpNo=${group}&pageNo=${page}`;
  const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' } });
  if (!res.ok) throw new Error(`금리 정보를 불러오지 못했어요 (HTTP ${res.status})`);
  const json = await res.json();
  const result = json.result;
  if (result.err_cd !== '000') throw new Error(`금리 정보를 불러오지 못했어요 (${result.err_msg})`);
  return result as {
    max_page_no: number;
    baseList: FinlifeBase[];
    optionList: FinlifeOption[];
  };
}

async function fetchAll(type: AccountType, apiKey: string): Promise<FinProduct[]> {
  const bases: (FinlifeBase & { group: FinProduct['group'] })[] = [];
  const options: FinlifeOption[] = [];
  for (const [code, group] of Object.entries(FIN_GROUPS)) {
    let page = 1;
    let maxPage = 1;
    do {
      const result = await fetchPage(type, code, page, apiKey);
      bases.push(...result.baseList.map((b) => ({ ...b, group })));
      options.push(...result.optionList);
      maxPage = Number(result.max_page_no);
      page++;
    } while (page <= maxPage);
  }
  return normalizeProducts(bases, options);
}

export interface ProductsResult {
  products: FinProduct[];
  fetchedAt: number;
}

/** 공시 상품 목록. 12시간 동안은 기기에 저장해 둔 것을 쓴다. */
export async function loadProducts(type: AccountType, { force = false } = {}): Promise<ProductsResult> {
  const apiKey = process.env.EXPO_PUBLIC_FINLIFE_API_KEY;
  if (!apiKey) throw new Error('금융상품한눈에 API 인증키가 설정되지 않았어요');

  const cacheKey = `finlife:${type}`;
  if (!force) {
    const cached = await Storage.getItemAsync(cacheKey);
    if (cached) {
      const parsed = JSON.parse(cached) as ProductsResult;
      if (Date.now() - parsed.fetchedAt < CACHE_TTL_MS) return parsed;
    }
  }

  const result = { products: await fetchAll(type, apiKey), fetchedAt: Date.now() };
  await Storage.setItemAsync(cacheKey, JSON.stringify(result));
  return result;
}
