import React, { createContext, useContext, useMemo, useState } from 'react';
import type { AccountType } from '../types/account';

interface WindmillTypeValue {
  type: AccountType;
  setType: (type: AccountType) => void;
}

const WindmillTypeContext = createContext<WindmillTypeValue | null>(null);

/** 홈에서 고른 적금 풍차/예금 풍차. 금리 비교는 처음 열 때 이 값을 쓴다. */
export function WindmillTypeProvider({ children }: { children: React.ReactNode }) {
  const [type, setType] = useState<AccountType>('savings');
  const value = useMemo(() => ({ type, setType }), [type]);
  return <WindmillTypeContext.Provider value={value}>{children}</WindmillTypeContext.Provider>;
}

export function useWindmillType(): WindmillTypeValue {
  const ctx = useContext(WindmillTypeContext);
  if (!ctx) throw new Error('useWindmillType must be used within WindmillTypeProvider');
  return ctx;
}
