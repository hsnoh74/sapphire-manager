export const fmt = (v: number | string | null | undefined) =>
  v == null || v === '' ? '-' : Number(v).toLocaleString()

export const pad = (n: number) => String(n).padStart(2, '0')

// 빈 칸은 null, 숫자가 아니면 undefined(오류), 쉼표는 제거
export const toNum = (v: string): number | null | undefined => {
  const t = v.trim().replace(/,/g, '')
  if (t === '') return null
  const n = Number(t)
  return Number.isFinite(n) ? n : undefined
}

// 123,400,000 -> "1억 2,340만원"
export const krw = (n: number) => {
  const a = Math.round(n || 0)
  if (a >= 1e8) {
    const e = Math.floor(a / 1e8)
    const m = Math.floor((a % 1e8) / 1e4)
    return e.toLocaleString() + '억' + (m ? ' ' + m.toLocaleString() + '만' : '') + '원'
  }
  if (a >= 1e4) return Math.floor(a / 1e4).toLocaleString() + '만원'
  return a.toLocaleString() + '원'
}

export const axisFmt = (v: number) =>
  v === 0 ? '0' : v >= 1e8 ? +(v / 1e8).toFixed(1) + '억' : v >= 1e4 ? (v / 1e4).toLocaleString() + '만' : String(v)

export const ago = (iso: string) => {
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 864e5)
  return d <= 0 ? '오늘' : d === 1 ? '어제' : d + '일 전'
}

export const sumBy = <T,>(arr: T[], pick: (x: T) => number | null | undefined) =>
  arr.reduce((t, x) => t + (Number(pick(x)) || 0), 0)

export const uniq = <T,>(arr: T[]) => Array.from(new Set(arr))
