'use client'
import { ReactNode, useEffect } from 'react'
import { Img } from '../lib/types'

export const COMPANY = '아즈텍 주식회사'

export function Field({ label, children }: { label: ReactNode; children: ReactNode }) {
  return (
    <div className="a-fld">
      <span className="a-lab">{label}</span>
      {children}
    </div>
  )
}

export const Req = () => <em>필수</em>

const PRODUCT_STAT: Record<string, string> = { 재고: 'st-stock', 판매중: 'st-sale', 출하완료: 'st-done' }
const ASSET_STAT: Record<string, string> = { 정상: 'st-sale', 수리중: 'st-stock', 대여중: 'st-rent', 폐기: 'st-del' }

export function StatTag({ status, kind }: { status: string | null; kind: 'product' | 'asset' }) {
  const map = kind === 'product' ? PRODUCT_STAT : ASSET_STAT
  const s = status || '-'
  return (
    <span className={`a-stat ${map[s] || 'st-etc'}`}>
      <i />
      {s}
    </span>
  )
}

export function PageHead({ eyebrow, title, sub, right }: { eyebrow: string; title: string; sub: ReactNode; right?: ReactNode }) {
  return (
    <div className="n-head">
      <div>
        <div className="a-eyebrow">{eyebrow}</div>
        <h1 className="n-title">
          <span className="n-co">{COMPANY}</span> {title}
        </h1>
        <div className="a-count">{sub}</div>
      </div>
      {right}
    </div>
  )
}

export function AdminCtl({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <div className="a-admin">
      {on && <span className="a-badge">ADMIN</span>}
      <button className="a-btn-ghost" onClick={onToggle}>
        {on ? '관리자 모드 끄기' : '🔒 관리자 모드'}
      </button>
    </div>
  )
}

export function ModalShell({ children, onClose, small }: { children: ReactNode; onClose: () => void; small?: boolean }) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', h)
    return () => document.removeEventListener('keydown', h)
  }, [onClose])
  return (
    <div className="a-ov" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`a-modal ${small ? 'sm' : ''}`} role="dialog" aria-modal="true">
        {children}
      </div>
    </div>
  )
}

export function ModalHead({ eyebrow, title, onClose }: { eyebrow: string; title: string; onClose: () => void }) {
  return (
    <div className="a-mhead">
      <div>
        <div className="a-eyebrow">{eyebrow}</div>
        <h3 className="a-h3">{title}</h3>
      </div>
      <button className="a-close" onClick={onClose} aria-label="닫기">×</button>
    </div>
  )
}

export function Row({ k, children }: { k: string; children?: ReactNode }) {
  const empty = children == null || children === '' || (Array.isArray(children) && children.length === 0)
  return (
    <>
      <dt>{k}</dt>
      <dd>{empty ? <span className="a-dash">—</span> : children}</dd>
    </>
  )
}

export function Gallery({ images, idx, onIdx }: { images: Img[]; idx: number; onIdx: (i: number) => void }) {
  const i = Math.min(idx, Math.max(images.length - 1, 0))
  return (
    <div>
      <div className="a-main">
        {images[i] ? <img src={images[i].url} alt="" /> : <div className="a-nophoto">사진없음</div>}
      </div>
      {images.length > 1 && (
        <div className="a-thumbs">
          {images.map((im, k) => (
            <button key={im.id} className={`a-th ${k === i ? 'on' : ''}`} onClick={() => onIdx(k)}>
              <img src={im.url} alt="" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// 사진 편집: 기존 사진(× 로 삭제 표시) + 새로 고른 사진
export function PhotoEditor({
  keep, onRemoveKeep, newUrls, onRemoveNew, onPick, inputKey,
}: {
  keep: Img[]; onRemoveKeep: (id: string) => void
  newUrls: string[]; onRemoveNew: (i: number) => void
  onPick: (files: File[]) => void; inputKey: number
}) {
  return (
    <div style={{ marginBottom: 14 }}>
      <span className="a-lab">사진 (× 를 눌러 삭제, 아래에서 추가)</span>
      <div className="a-thumbs" style={{ margin: '0 0 10px' }}>
        {keep.map((im) => (
          <div className="a-th-wrap" key={im.id}>
            <img className="a-eth" src={im.url} alt="" />
            <button className="a-x" onClick={() => onRemoveKeep(im.id)} aria-label="사진 삭제">×</button>
          </div>
        ))}
        {newUrls.map((u, i) => (
          <div className="a-th-wrap" key={u}>
            <img className="a-eth" src={u} alt="" style={{ outline: '2px solid var(--lime)' }} />
            <button className="a-x" onClick={() => onRemoveNew(i)} aria-label="추가한 사진 취소">×</button>
          </div>
        ))}
        {keep.length === 0 && newUrls.length === 0 && <span className="a-dash" style={{ fontSize: 13 }}>사진 없음</span>}
      </div>
      <input
        key={inputKey}
        type="file"
        multiple
        accept="image/*"
        className="a-file"
        onChange={(e) => onPick(Array.from(e.target.files || []))}
      />
    </div>
  )
}

export function Previews({ urls }: { urls: string[] }) {
  if (!urls.length) return null
  return (
    <>
      <div className="a-pvlab">선택한 사진 {urls.length}장 (업로드 시 약 300KB로 자동 압축)</div>
      <div className="a-pv">
        {urls.map((u) => (
          <img key={u} src={u} alt="" />
        ))}
      </div>
    </>
  )
}
