'use client'
import { useEffect, useMemo, useState } from 'react'
import { createProduct, deleteProduct, updateProduct } from '../lib/data'
import { fmt, pad, uniq } from '../lib/format'
import { useObjectUrls } from '../lib/hooks'
import {
  APPLICATIONS, Img, PRODUCT_CATEGORIES, PRODUCT_STATUS, Product, ProductForm, emptyProductForm, productToForm,
} from '../lib/types'
import { ScrollPicker } from './ScrollPicker'
import { AdminCtl, Field, Gallery, ModalHead, ModalShell, PageHead, PhotoEditor, Previews, Req, Row, StatTag } from './ui'

type ModalState = { id: string; mode: 'view' | 'edit' | 'del'; idx: number; from?: 'card' } | null

export function Products({
  products, admin, onToggleAdmin, onChanged, notify, openId, onOpened,
}: {
  products: Product[]; admin: boolean; onToggleAdmin: () => void
  onChanged: () => Promise<void>; notify: (m: string, bad?: boolean) => void
  openId: string | null; onOpened: () => void
}) {
  const [form, setForm] = useState<ProductForm>(emptyProductForm())
  const [files, setFiles] = useState<File[]>([])
  const [fileKey, setFileKey] = useState(0)
  const [busy, setBusy] = useState(false)
  const [modal, setModal] = useState<ModalState>(null)
  const [showForm, setShowForm] = useState(false) // 모바일·태블릿: 등록창 열림 여부
  // 수정 창 상태
  const [ef, setEf] = useState<ProductForm>(emptyProductForm())
  const [keep, setKeep] = useState<Img[]>([])
  const [newFiles, setNewFiles] = useState<File[]>([])
  const [editKey, setEditKey] = useState(0)

  useEffect(() => { if (!admin) setShowForm(false) }, [admin])

  const previews = useObjectUrls(files)
  const newUrls = useObjectUrls(newFiles)

  const categories = useMemo(() => uniq([...PRODUCT_CATEGORIES, ...products.map((p) => p.category || '').filter(Boolean)]), [products])
  const applications = useMemo(() => uniq([...APPLICATIONS, ...products.flatMap((p) => p.application || [])]), [products])

  // 대시보드에서 항목을 눌러 들어온 경우 상세 창 열기
  useEffect(() => {
    if (openId) { setModal({ id: openId, mode: 'view', idx: 0 }); onOpened() }
  }, [openId, onOpened])

  const current = modal ? products.find((p) => p.id === modal.id) : undefined
  useEffect(() => { if (modal && !current) setModal(null) }, [modal, current])

  const set = <K extends keyof ProductForm>(k: K, v: ProductForm[K]) => setForm((f) => ({ ...f, [k]: v }))
  const setE = <K extends keyof ProductForm>(k: K, v: ProductForm[K]) => setEf((f) => ({ ...f, [k]: v }))

  const submit = async () => {
    setBusy(true)
    try {
      await createProduct(form, files)
      notify('등록되었습니다')
      setForm(emptyProductForm()); setFiles([]); setFileKey((k) => k + 1)
      setShowForm(false)
    } catch (e: any) {
      notify('등록 중 오류: ' + (e?.message || e), true)
    } finally {
      await onChanged()
      setBusy(false)
    }
  }

  const startEdit = (p: Product, fromCard: boolean) => {
    setEf(productToForm(p)); setKeep([...p.images]); setNewFiles([]); setEditKey((k) => k + 1)
    setModal({ id: p.id, mode: 'edit', idx: 0, from: fromCard ? 'card' : undefined })
  }
  const askDelete = (p: Product, fromCard: boolean) => setModal({ id: p.id, mode: 'del', idx: 0, from: fromCard ? 'card' : undefined })

  const saveEdit = async () => {
    if (!current || !modal) return
    setBusy(true)
    try {
      const removed = current.images.filter((i) => !keep.some((k) => k.id === i.id))
      await updateProduct(current.id, ef, removed, newFiles)
      notify('수정되었습니다')
      await onChanged()
      setModal(modal.from === 'card' ? null : { id: current.id, mode: 'view', idx: 0 })
    } catch (e: any) {
      notify('수정 중 오류: ' + (e?.message || e), true)
    } finally { setBusy(false) }
  }

  const doDelete = async () => {
    if (!current) return
    setBusy(true)
    try {
      await deleteProduct(current)
      notify('삭제되었습니다')
      setModal(null)
      await onChanged()
    } catch (e: any) {
      notify('삭제 중 오류: ' + (e?.message || e), true)
    } finally { setBusy(false) }
  }

  const n = products.length
  const c = (k: string) => products.filter((p) => p.status === k).length
  const close = () => setModal(null)
  const back = () => (modal?.from === 'card' ? setModal(null) : modal && setModal({ id: modal.id, mode: 'view', idx: 0 }))

  return (
    <>
      <PageHead
        eyebrow="Product Catalogue" title="판매제품 현황"
        sub={<>총 <b>{n}</b>건 &nbsp;·&nbsp; 재고 <b>{c('재고')}</b> &nbsp;·&nbsp; 판매중 <b>{c('판매중')}</b> &nbsp;·&nbsp; 출하완료 <b>{c('출하완료')}</b></>}
        right={<AdminCtl on={admin} onToggle={onToggleAdmin} />}
      />
      {admin && <button className="a-addbtn" onClick={() => setShowForm(true)}>＋ 제품 등록</button>}
      <div className={`a-grid ${admin ? '' : 'no-form'}`}>
        {admin && (
        <aside className={`n-panel a-form a-reg ${showForm ? 'is-open' : ''}`}>
          <div className="a-sheethead">
            <span>판매제품 등록</span>
            <button className="a-close" onClick={() => setShowForm(false)} aria-label="닫기">×</button>
          </div>
          <div className="n-ct">· 판매제품 등록</div>
          <div className="a-rule" />
          <Field label={<>제품명<Req /></>}>
            <input className="a-inp" value={form.product_name} onChange={(e) => set('product_name', e.target.value)} placeholder="예) 4인치 C-plane 웨이퍼" />
          </Field>
          <Field label="불(Boule) ID">
            <input className="a-inp" value={form.boule_id} onChange={(e) => set('boule_id', e.target.value)} placeholder="예) B-2024-017" />
          </Field>
          <ScrollPicker label="카테고리" options={categories} value={form.category} onChange={(v) => set('category', v)} allowAdd addPlaceholder="새 카테고리" />
          <ScrollPicker label="상태" options={PRODUCT_STATUS} value={form.status} onChange={(v) => set('status', v)} />
          <ScrollPicker label="제품 응용처 (복수 선택)" options={applications} value={form.application} onChange={(v) => set('application', v)} multi allowAdd addPlaceholder="새 응용처" />
          <Field label="고객사 / 판매처"><input className="a-inp" value={form.customer} onChange={(e) => set('customer', e.target.value)} /></Field>
          <div className="a-two">
            <Field label="판매가격"><input className="a-inp" inputMode="decimal" value={form.price} onChange={(e) => set('price', e.target.value)} /></Field>
            <Field label="재고 위치"><input className="a-inp" value={form.stock_location} onChange={(e) => set('stock_location', e.target.value)} /></Field>
          </div>
          <Field label="상세 설명">
            <textarea className="a-inp" rows={4} value={form.memo} onChange={(e) => set('memo', e.target.value)} placeholder="규격, 특성, 비고 등을 자유롭게 적어 주세요" />
          </Field>
          <Field label="사진">
            <input key={fileKey} type="file" multiple accept="image/*" className="a-file" onChange={(e) => setFiles(Array.from(e.target.files || []))} />
          </Field>
          <Previews urls={previews} />
          <button className="a-btn" onClick={submit} disabled={busy}>{busy ? '처리 중…' : '등 록'}</button>
        </aside>
        )}

        <section>
          <div className="n-ct" style={{ marginBottom: 14 }}>· 판매제품 목록</div>
          {admin
            ? <div className="a-note">관리자 모드 — 각 사진의 수정·삭제 버튼을 사용하세요. 사진을 클릭하면 상세 정보가 열립니다.</div>
            : <div className="a-note" style={{ color: 'var(--muted)' }}>제품 사진을 누르면 상세 정보가 열립니다. 등록·수정·삭제는 관리자 모드에서 가능합니다.</div>}
          <div className="a-cards">
            {n === 0 && <div className="a-empty">등록된 제품이 없습니다.</div>}
            {products.map((p, i) => (
              <article key={p.id} className={`a-card ${admin ? 'is-admin' : ''}`}>
                <button className="a-fig" onClick={() => setModal({ id: p.id, mode: 'view', idx: 0 })} aria-label={`${p.product_name} 상세 보기`}>
                  {p.images[0] ? <img src={p.images[0].url} alt={p.product_name} /> : <div className="a-nophoto">사진없음</div>}
                  {p.images.length > 1 && <span className="a-more">+{p.images.length - 1}</span>}
                  <span className="a-hover">{admin ? '상세 · 수정 · 삭제' : '상세 보기'}</span>
                </button>
                {admin && (
                  <div className="a-cardact">
                    <button onClick={() => startEdit(p, true)}>수정</button>
                    <button className="danger" onClick={() => askDelete(p, true)}>삭제</button>
                  </div>
                )}
                <div className="a-cap">
                  <div className="a-no">No. {pad(n - i)}</div>
                  <h4 className="a-title">{p.product_name}</h4>
                  <div className="a-meta"><span>{p.category}</span><StatTag status={p.status} kind="product" /></div>
                  <div className="a-sub"><span>{p.customer || <span className="a-dash">—</span>}</span><span className="a-price">{p.price != null ? fmt(p.price) : ''}</span></div>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>

      {modal && current && modal.mode !== 'edit' && (
        <ModalShell onClose={close}>
          <ModalHead eyebrow={`Product No. ${pad(n - products.indexOf(current))}`} title={current.product_name} onClose={close} />
          <div className="a-mbody a-prod">
            <Gallery images={current.images} idx={modal.idx} onIdx={(i) => setModal({ ...modal, idx: i })} />
            <div className="a-info">
              <div className="a-memo">
                <div className="k">상세 설명</div>
                {current.memo ? <div className="t">{current.memo}</div> : <div className="t none">등록된 상세 설명이 없습니다.</div>}
              </div>
              <dl className="a-dl">
                <Row k="카테고리">{current.category}</Row>
                <Row k="상태"><StatTag status={current.status} kind="product" /></Row>
                <Row k="응용처">{(current.application || []).map((t) => <span className="a-tag" key={t}>{t}</span>)}</Row>
                <Row k="불(Boule) ID">{current.boule_id}</Row>
                <Row k="고객사">{current.customer}</Row>
                <Row k="판매가격">{current.price != null ? fmt(current.price) : ''}</Row>
                <Row k="재고 위치">{current.stock_location}</Row>
              </dl>
            </div>
          </div>
          {modal.mode === 'del' ? (
            <div className="a-mfoot">
              <span className="a-warn">‘{current.product_name}’ 을(를) 삭제합니다. 사진도 함께 지워지며 되돌릴 수 없습니다.</span>
              <button className="a-btn-ghost" onClick={back}>취소</button>
              <button className="a-btn a-btn-danger" onClick={doDelete} disabled={busy}>{busy ? '삭제 중…' : '삭제 확인'}</button>
            </div>
          ) : admin ? (
            <div className="a-mfoot">
              <button className="a-btn-ghost" onClick={close}>닫기</button>
              <button className="a-btn-ghost" onClick={() => startEdit(current, false)}>수정</button>
              <button className="a-btn a-btn-danger" onClick={() => askDelete(current, false)}>삭제</button>
            </div>
          ) : (
            <div className="a-mfoot">
              <span className="a-hint">수정·삭제는 관리자 모드에서 가능합니다.</span>
              <button className="a-btn-ghost" onClick={close}>닫기</button>
            </div>
          )}
        </ModalShell>
      )}

      {modal && current && modal.mode === 'edit' && (
        <ModalShell onClose={close}>
          <ModalHead eyebrow={`Edit · No. ${pad(n - products.indexOf(current))}`} title="제품 정보 수정" onClose={close} />
          <div className="a-mbody">
            <PhotoEditor
              keep={keep} onRemoveKeep={(id) => setKeep(keep.filter((k) => k.id !== id))}
              newUrls={newUrls} onRemoveNew={(i) => setNewFiles(newFiles.filter((_, k) => k !== i))}
              onPick={(fs) => { setNewFiles([...newFiles, ...fs]); setEditKey((k) => k + 1) }} inputKey={editKey}
            />
            <div>
              <Field label={<>제품명<Req /></>}><input className="a-inp" value={ef.product_name} onChange={(e) => setE('product_name', e.target.value)} /></Field>
              <Field label="불(Boule) ID"><input className="a-inp" value={ef.boule_id} onChange={(e) => setE('boule_id', e.target.value)} /></Field>
              <ScrollPicker label="카테고리" options={categories} value={ef.category} onChange={(v) => setE('category', v)} allowAdd addPlaceholder="새 카테고리" />
              <ScrollPicker label="상태" options={PRODUCT_STATUS} value={ef.status} onChange={(v) => setE('status', v)} />
              <ScrollPicker label="제품 응용처 (복수 선택)" options={applications} value={ef.application} onChange={(v) => setE('application', v)} multi allowAdd addPlaceholder="새 응용처" />
              <Field label="고객사 / 판매처"><input className="a-inp" value={ef.customer} onChange={(e) => setE('customer', e.target.value)} /></Field>
              <div className="a-two">
                <Field label="판매가격"><input className="a-inp" inputMode="decimal" value={ef.price} onChange={(e) => setE('price', e.target.value)} /></Field>
                <Field label="재고 위치"><input className="a-inp" value={ef.stock_location} onChange={(e) => setE('stock_location', e.target.value)} /></Field>
              </div>
              <Field label="상세 설명"><textarea className="a-inp" rows={4} value={ef.memo} onChange={(e) => setE('memo', e.target.value)} /></Field>
            </div>
          </div>
          <div className="a-mfoot">
            <button className="a-btn-ghost" onClick={back}>취소</button>
            <button className="a-btn" onClick={saveEdit} disabled={busy}>{busy ? '저장 중…' : '저장'}</button>
          </div>
        </ModalShell>
      )}
    </>
  )
}
