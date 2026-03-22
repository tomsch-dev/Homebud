const CURRENCY_SYMBOLS: Record<string, string> = {
  EUR: '€',
  USD: '$',
  GBP: '£',
  CHF: 'CHF',
  JPY: '¥',
  CNY: '¥',
  KRW: '₩',
  INR: '₹',
  BRL: 'R$',
  SEK: 'kr',
  NOK: 'kr',
  DKK: 'kr',
  PLN: 'zł',
  CZK: 'Kč',
  TRY: '₺',
  RUB: '₽',
  AUD: 'A$',
  CAD: 'C$',
};

export function currencySymbol(code: string): string {
  return CURRENCY_SYMBOLS[code.toUpperCase()] || code;
}

export function fmtCurrency(amount: number, code: string, decimals = 2): string {
  const sym = currencySymbol(code);
  const val = amount.toFixed(decimals);
  // Prefix symbols go before, multi-char codes go after
  if (sym.length <= 1 || sym === 'R$' || sym === 'A$' || sym === 'C$') {
    return `${sym}${val}`;
  }
  return `${val} ${sym}`;
}
