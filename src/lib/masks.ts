// Máscaras e validações de entrada no padrão brasileiro. Usadas como `mask`
// no componente Input (filtram a digitação: o usuário não consegue digitar
// mais caracteres nem caracteres diferentes do permitido) e na validação.

/** Mantém só dígitos. */
export function digits(s: string): string {
  return s.replace(/\D+/g, "");
}

/** CPF: 000.000.000-00 (limita a 11 dígitos). */
export function maskCPF(s: string): string {
  const d = digits(s).slice(0, 11);
  if (d.length > 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
  if (d.length > 6) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  if (d.length > 3) return `${d.slice(0, 3)}.${d.slice(3)}`;
  return d;
}

/** Data brasileira: dd/mm/aaaa (limita a 8 dígitos). */
export function maskDateBR(s: string): string {
  const d = digits(s).slice(0, 8);
  if (d.length > 4) return `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4)}`;
  if (d.length > 2) return `${d.slice(0, 2)}/${d.slice(2)}`;
  return d;
}

/** Telefone BR: (00) 00000-0000 (celular) ou (00) 0000-0000 (fixo). */
export function maskPhoneBR(s: string): string {
  const d = digits(s).slice(0, 11);
  if (d.length === 0) return "";
  if (d.length <= 2) return `(${d}`;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

/** CEP: 00000-000. */
export function maskCEP(s: string): string {
  const d = digits(s).slice(0, 8);
  if (d.length > 5) return `${d.slice(0, 5)}-${d.slice(5)}`;
  return d;
}

/** Inteiro positivo com no máximo `maxLen` dígitos. */
export function maskInt(s: string, maxLen = 6): string {
  return digits(s).slice(0, maxLen);
}

/**
 * Número decimal no padrão BR (vírgula): mantém só dígitos e UMA vírgula,
 * com no máximo `intDigits` dígitos inteiros e `decimals` casas decimais.
 * Aceita ponto digitado e converte para vírgula.
 */
export function maskDecimal(
  s: string,
  opts?: { intDigits?: number; decimals?: number },
): string {
  const intDigits = opts?.intDigits ?? 4;
  const decimals = opts?.decimals ?? 2;
  let v = s.replace(/[^\d.,]/g, "").replace(/\./g, ",");
  const firstComma = v.indexOf(",");
  if (firstComma !== -1) {
    v =
      v.slice(0, firstComma + 1) +
      v.slice(firstComma + 1).replace(/,/g, "");
  }
  const parts = v.split(",");
  const intPart = parts[0].slice(0, intDigits);
  if (parts.length > 1) {
    return `${intPart},${parts[1].slice(0, decimals)}`;
  }
  return intPart;
}

/** Converte "1.234,56" / "1,75" / "80" para number; "" → null; inválido → null. */
export function parseDecimalBR(s: string): number | null {
  const t = s.trim().replace(/\./g, "").replace(",", ".");
  if (t === "") return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

/** Limita um número ao intervalo [min, max]. */
export function clampNumber(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

/** Validação completa de CPF (dígitos verificadores). */
export function isValidCPF(s: string): boolean {
  const d = digits(s);
  if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) return false;
  const calc = (len: number) => {
    let sum = 0;
    for (let i = 0; i < len; i++) sum += Number(d[i]) * (len + 1 - i);
    const r = (sum * 10) % 11;
    return r === 10 ? 0 : r;
  };
  return calc(9) === Number(d[9]) && calc(10) === Number(d[10]);
}

/** Valida data dd/mm/aaaa real (existe no calendário) e retorna Date | null. */
export function parseDateBR(s: string): Date | null {
  const m = s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return null;
  const day = Number(m[1]);
  const month = Number(m[2]);
  const year = Number(m[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const d = new Date(year, month - 1, day);
  if (
    d.getFullYear() !== year ||
    d.getMonth() !== month - 1 ||
    d.getDate() !== day
  ) {
    return null;
  }
  return d;
}

export function isValidDateBR(s: string): boolean {
  return parseDateBR(s) !== null;
}
