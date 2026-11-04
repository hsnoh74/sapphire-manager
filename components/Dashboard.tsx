'use client'
import { ReactNode, useState } from 'react'
import { Asset, Product } from '../lib/types'
import { ago, axisFmt, fmt, krw, sumBy } from '../lib/format'
import { PageHead, StatTag } from './ui'

const PALETTE = ['#d6ff3a', '#a855f7', '#ff4fb0', '#34d36a', '#4d94ff', '#ffa94d', '#2dd4bf']
type Tip = { x: number; y: number; t: string } | null

function Delta({ total, add, money }: { total: number; add: number; money?: boolean }) {
  if (!add) return <span className="n-delta flat">- (0.0%)</span>
  const base = total - add
  const pct = base > 0 ? ((Math.abs(add) / base) * 100).toFixed(1) + '%' : '신규'
  const f = money ? axisFmt(Math.round(Math.abs(add))) : Math.abs(add).toLocaleString()
  return (
    <span className={`n-delta ${add > 0 ? 'up' : 'down'}`}>
      {add > 0 ? '▲' : '▼'} {f} ({add > 0 ? '+' : '-'}{pct})
    </span>
  )
}

function Donut({ rows, total, colorOf }: { rows: [string, number][]; total: number; colorOf: (c: string) => string }) {
  if (!total) return <div className="a-empty">표시할 자산이 없습니다.</div>
  const cx = 190, cy = 150, r = 88, sw = 36, C = 2 * Math.PI * r
  let off = 0
  const parts: ReactNode[] = []
  rows.forEach(([c, v]) => {
    const frac = v / total, len = frac * C, col = colorOf(c)
    const tip = `${c}\n${krw(v)} (${(frac * 100).toFixed(1)}%)`
    const mid = ((off + len / 2) / C) * 2 * Math.PI - Math.PI / 2
    const lr = r + sw / 2 + 14, x = cx + lr * Math.cos(mid), y = cy + lr * Math.sin(mid), cs = Math.cos(mid)
    const anchor = cs > 0.2 ? 'start' : cs < -0.2 ? 'end' : 'middle'
    parts.push(
      <g key={c}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={col} strokeWidth={sw} strokeDasharray={`${rows.length > 1 ? Math.max(len - 2, 0.5) : C} ${C}`}
          strokeDashoffset={-off} transform={`rotate(-90 ${cx} ${cy})`} data-tip={tip} className="dn" />
        {frac >= 0.04 && (
          <>
            <text x={x} y={y} textAnchor={anchor} fontSize="12" fill="#c9c9d4">{c}</text>
            <text x={x} y={y + 14} textAnchor={anchor} fontSize="11" fill={col}>{(frac * 100).toFixed(1)}%</text>
          </>
        )}
      </g>
    )
    off += len
  })
  return (
    <svg viewBox="0 0 380 300" className="n-svg" role="img" aria-label="카테고리별 자산 비중">
      {parts}
      <text x={cx} y={cy - 8} textAnchor="middle" fontSize="13" fill="#9a9aab">자산 합계</text>
      <text x={cx} y={cy + 18} textAnchor="middle" fontSize="19" fontWeight="500" fill="#fff">{total.toLocaleString()}원</text>
    </svg>
  )
}

function Growth({ assets, range, unit, cats, colorOf }: { assets: Asset[]; range: string; unit: string; cats: string[]; colorOf: (c: string) => string }) {
  const now = new Date()
  const nowIdx = now.getFullYear() * 12 + now.getMonth()
  const dOf = (a: Asset) => new Date((a.registered_date || String(a.created_at).slice(0, 10)) + 'T00:00:00')
  let startIdx: number
  if (range === '전체') {
    startIdx = Math.min(...assets.map((a) => { const d = dOf(a); return d.getFullYear() * 12 + d.getMonth() }), nowIdx - 11)
  } else startIdx = nowIdx - ({ '1년': 1, '3년': 3, '5년': 5 } as Record<string, number>)[range] * 12 + 1
  const step = unit === '분기' ? 3 : 1
  const pts: number[] = []
  for (let i = nowIdx; i >= startIdx; i -= step) pts.unshift(i)

  const data = pts.map((idx) => {
    const y = Math.floor(idx / 12), m = idx % 12
    const end = idx === nowIdx ? now : new Date(y, m + 1, 0, 23, 59, 59)
    const seg: Record<string, number> = {}
    let tot = 0
    assets.forEach((a) => {
      const reg = dOf(a)
      const disp = a.disposal_date ? new Date(a.disposal_date + 'T00:00:00') : null
      if (reg <= end && (!disp || disp > end)) {
        const v = Number(a.purchase_price) || 0
        const c = a.category || '기타'
        seg[c] = (seg[c] || 0) + v
        tot += v
      }
    })
    return { label: String(y).slice(2) + '-' + String(m + 1).padStart(2, '0'), seg, tot }
  })
  const max = Math.max(...data.map((d) => d.tot), 0)
  if (!max) return <div className="a-empty">표시할 데이터가 없습니다.</div>

  const raw = max / 4, p10 = Math.pow(10, Math.floor(Math.log10(raw)))
  const stepY = [1, 2, 2.5, 5, 10].map((k) => k * p10).find((v) => v >= raw)!
  const top = stepY * 4
  const W = 640, H = 300, ml = 52, mr = 8, mt = 8, mb = 54, pw = W - ml - mr, ph = H - mt - mb
  const slot = pw / data.length, bw = Math.max(3, slot * 0.7)
  const Y = (v: number) => mt + ph - (v / top) * ph
  const every = data.length > 18 ? Math.ceil(data.length / 12) : 1
  const usedCats = cats.filter((c) => data.some((d) => d.seg[c]))

  return (
    <>
      <div className="n-legend">
        {usedCats.map((c) => (<span key={c}><i style={{ background: colorOf(c) }} />{c}</span>))}
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="n-svg" role="img" aria-label="월별 자산 금액 추이">
        {[0, 1, 2, 3, 4].map((k) => (
          <g key={k}>
            <line x1={ml} x2={W - mr} y1={Y(stepY * k)} y2={Y(stepY * k)} stroke="#2a2a34" strokeWidth="1" />
            <text x={ml - 8} y={Y(stepY * k) + 4} textAnchor="end" fontSize="10.5" fill="#9a9aab">{axisFmt(stepY * k)}</text>
          </g>
        ))}
        {data.map((d, i) => {
          const x = ml + i * slot + (slot - bw) / 2
          let acc = 0
          const tip = `${d.label}\n합계 ${krw(d.tot)}` + usedCats.filter((c) => d.seg[c]).map((c) => `\n${c} ${krw(d.seg[c])}`).join('')
          const tx = x + bw / 2, ty = H - mb + 14
          return (
            <g key={d.label + i}>
              <g className="cb" data-tip={tip}>
                <rect x={ml + i * slot} y={mt} width={slot} height={ph} fill="transparent" />
                {usedCats.map((c) => {
                  const v = d.seg[c]
                  if (!v) return null
                  const y1 = Y(acc + v), y0 = Y(acc)
                  acc += v
                  return <rect key={c} x={x} y={y1} width={bw} height={Math.max(0, y0 - y1 - 1)} fill={colorOf(c)} />
                })}
              </g>
              {(data.length - 1 - i) % every === 0 && (
                <text x={tx} y={ty} textAnchor="end" fontSize="10" fill="#9a9aab" transform={`rotate(-50 ${tx} ${ty})`}>{d.label}</text>
              )}
            </g>
          )
        })}
      </svg>
    </>
  )
}

export function Dashboard({
  products, assets, email, onOpen, onTab,
}: {
  products: Product[]; assets: Asset[]; email: string
  onOpen: (kind: 'product' | 'asset', id: string) => void
  onTab: (t: 'products' | 'assets') => void
}) {
  const [range, setRange] = useState('3년')
  const [unit, setUnit] = useState('월')
  const [tip, setTip] = useState<Tip>(null)

  const held = assets.filter((a) => a.status !== '폐기')
  const totalBuy = sumBy(assets, (a) => a.purchase_price)
  const heldRes = sumBy(held, (a) => a.residual_value)
  const heldBuy = sumBy(held, (a) => a.purchase_price)
  const cut = Date.now() - 30 * 864e5
  const isNew = (x: { created_at: string }) => new Date(x.created_at).getTime() >= cut
  const newA = assets.filter(isNew), newAheld = newA.filter((a) => a.status !== '폐기'), newP = products.filter(isNew)
  const cnt = <T,>(arr: T[], pick: (x: T) => string | null, v: string) => arr.filter((x) => pick(x) === v).length

  // 카테고리 색은 "처음 등록된 순서"로 고정 → 데이터가 늘어도 기존 색이 바뀌지 않음
  const catOrder = Array.from(new Set([...assets].sort((a, b) => a.created_at.localeCompare(b.created_at)).map((a) => a.category || '기타')))
  const colorOf = (c: string) => PALETTE[Math.max(0, catOrder.indexOf(c)) % PALETTE.length]
  const catMap: Record<string, number> = {}
  assets.forEach((a) => { const c = a.category || '기타'; catMap[c] = (catMap[c] || 0) + (Number(a.purchase_price) || 0) })
  const catRows = Object.entries(catMap).sort((x, y) => y[1] - x[1])

  const photos = [
    ...products.map((p) => ({ kind: 'product' as const, id: p.id, name: p.product_name, at: p.created_at, url: p.images[0]?.url })),
    ...assets.map((a) => ({ kind: 'asset' as const, id: a.id, name: a.name, at: a.created_at, url: a.images[0]?.url })),
  ].filter((x) => x.url).sort((x, y) => new Date(y.at).getTime() - new Date(x.at).getTime()).slice(0, 4)

  const byNew = <T extends { created_at: string }>(arr: T[]) =>
    [...arr].sort((x, y) => new Date(y.created_at).getTime() - new Date(x.created_at).getTime()).slice(0, 6)
  const dateStr = new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })

  const onMove = (e: React.MouseEvent) => {
    const el = (e.target as Element).closest?.('[data-tip]')
    if (el) setTip({ x: e.clientX, y: e.clientY, t: el.getAttribute('data-tip') || '' })
    else if (tip) setTip(null)
  }
  const seg = (cur: string, set: (v: string) => void, opts: string[]) =>
    opts.map((o) => (<button key={o} className={`n-seg ${cur === o ? 'on' : ''}`} onClick={() => set(o)}>{o}</button>))

  return (
    <div onMouseMove={onMove} onMouseLeave={() => setTip(null)}>
      <PageHead eyebrow="Dashboard · Overview" title="자산 포트폴리오" sub={<>{dateStr} &nbsp;·&nbsp; {email} 님 접속 중</>} />

      <div className="n-kpis">
        <div className="n-kpi">
          <div className="n-krow"><span className="n-pill purple">전체 자산 금액</span><Delta total={totalBuy} add={sumBy(newA, (a) => a.purchase_price)} money /></div>
          <div className="n-num">{totalBuy.toLocaleString()}<small>원</small></div>
          <div className="n-sub">구입가격 합계 · 폐기 {assets.length - held.length}건 포함</div>
        </div>
        <div className="n-kpi">
          <div className="n-krow"><span className="n-pill pink">잔존가치 합계</span><Delta total={heldRes} add={sumBy(newAheld, (a) => a.residual_value)} money /></div>
          <div className="n-num">{heldRes.toLocaleString()}<small>원</small></div>
          <div className="n-sub">폐기 제외 · 보유 자산 구입가 대비 {heldBuy ? Math.round((heldRes / heldBuy) * 100) : 0}%</div>
        </div>
        <div className="n-kpi">
          <div className="n-krow"><span className="n-pill green">총 자산 수</span><Delta total={assets.length} add={newA.length} /></div>
          <div className="n-num">{assets.length}<small>건</small></div>
          <div className="n-sub">정상 {cnt(assets, (a) => a.status, '정상')} · 수리중 {cnt(assets, (a) => a.status, '수리중')} · 대여중 {cnt(assets, (a) => a.status, '대여중')} · 폐기 {cnt(assets, (a) => a.status, '폐기')}</div>
        </div>
        <div className="n-kpi">
          <div className="n-krow"><span className="n-pill lime">총 판매제품 수</span><Delta total={products.length} add={newP.length} /></div>
          <div className="n-num">{products.length}<small>건</small></div>
          <div className="n-sub">재고 {cnt(products, (p) => p.status, '재고')} · 판매중 {cnt(products, (p) => p.status, '판매중')} · 출하완료 {cnt(products, (p) => p.status, '출하완료')}</div>
        </div>
      </div>
      <div className="n-note">▲▼ 변동은 최근 30일 신규 등록분 기준입니다.</div>

      <div className="n-row2">
        <section className="n-card">
          <div className="n-ct">· 카테고리별 자산 비중</div>
          <Donut rows={catRows} total={totalBuy} colorOf={colorOf} />
        </section>
        <section className="n-card">
          <div className="n-ctl">
            <div className="n-ct">· 월별 자산 금액 추이</div>
            <div className="n-segs"><span>기간</span>{seg(range, setRange, ['1년', '3년', '5년', '전체'])}<span style={{ marginLeft: 10 }}>단위</span>{seg(unit, setUnit, ['월', '분기'])}</div>
          </div>
          <Growth assets={assets} range={range} unit={unit} cats={catOrder} colorOf={colorOf} />
        </section>
      </div>

      <div className="n-sec"><div className="n-ct">· 최근 등록 사진 <em>최신 등록 순 4컷</em></div></div>
      <div className="d-photos">
        {photos.map((x) => (
          <button key={x.kind + x.id} className="d-ph" onClick={() => onOpen(x.kind, x.id)} aria-label={x.name}>
            <img src={x.url} alt={x.name} />
            <span className="d-cap">
              <span className="d-kind">{x.kind === 'product' ? '판매제품' : '자산'} · {ago(x.at)}</span>
              <span className="d-nm">{x.name}</span>
            </span>
          </button>
        ))}
        {Array.from({ length: Math.max(0, 4 - photos.length) }).map((_, i) => (<div key={'e' + i} className="d-ph empty">등록 대기</div>))}
      </div>

      <div className="d-lists">
        <section className="n-card">
          <div className="n-sec" style={{ margin: '0 0 8px' }}>
            <div className="n-ct">· 자산 리스트</div>
            <button className="d-more" onClick={() => onTab('assets')}>전체 보기 →</button>
          </div>
          <div className="d-rows">
            {byNew(assets).map((a) => (
              <button key={a.id} className="d-row" onClick={() => onOpen('asset', a.id)}>
                <span className="d-main"><b>{a.name}</b><small>{a.category} · {a.location || '위치 미정'}</small></span>
                <StatTag status={a.status} kind="asset" />
                <span className="d-amt">{a.purchase_price != null ? krw(a.purchase_price) : '-'}</span>
              </button>
            ))}
            {assets.length === 0 && <div className="a-empty">등록된 자산이 없습니다.</div>}
          </div>
        </section>
        <section className="n-card">
          <div className="n-sec" style={{ margin: '0 0 8px' }}>
            <div className="n-ct">· 판매제품 리스트</div>
            <button className="d-more" onClick={() => onTab('products')}>전체 보기 →</button>
          </div>
          <div className="d-rows">
            {byNew(products).map((p) => (
              <button key={p.id} className="d-row" onClick={() => onOpen('product', p.id)}>
                <span className="d-th">{p.images[0] && <img src={p.images[0].url} alt="" />}</span>
                <span className="d-main"><b>{p.product_name}</b><small>{p.category} · {p.customer || '고객사 미정'}</small></span>
                <StatTag status={p.status} kind="product" />
                <span className="d-amt">{p.price != null ? fmt(p.price) : '-'}</span>
              </button>
            ))}
            {products.length === 0 && <div className="a-empty">등록된 제품이 없습니다.</div>}
          </div>
        </section>
      </div>

      {tip && (
        <div className="n-tip" style={{ left: Math.min(tip.x + 14, (typeof window !== 'undefined' ? window.innerWidth : 1200) - 230), top: tip.y + 16 }}>{tip.t}</div>
      )}
    </div>
  )
}
