'use client'
import { ReactNode, useEffect, useMemo, useState } from 'react'
import { createAsset, deleteAsset, updateAsset } from '../lib/data'
import { fmt, uniq } from '../lib/format'
import { useObjectUrls } from '../lib/hooks'
import { ASSET_CATEGORIES, ASSET_STATUS, Asset, AssetForm, Img, assetToForm, emptyAssetForm } from '../lib/types'
import { ScrollPicker } from './ScrollPicker'
import { AdminCtl, Field, Gallery, ModalHead, ModalShell, PageHead, PhotoEditor, Previews, Req, Row, StatTag } from './ui'

type Sel = { id: string; mode: 'view' | 'edit'; idx: number } | null

export function Assets({
  assets, admin, onToggleAdmin, onChanged, notify, openId, onOpened,
}: {
  assets: Asset[]; admin: boolean; onToggleAdmin: () => void
  onChanged: () => Promise<void>; notify: (m: string, bad?: boolean) => void
  openId: string | null; onOpened: () => void
}) {
  const [form, setForm] = useState<AssetForm>(emptyAssetForm())
  const [files, setFiles] = useState<File[]>([])
  const [fileKey, setFileKey] = useState(0)
  const [busy, setBusy] = useState(false)
  const [sel, setSel] = useState<Sel>(null)
  const [ef, setEf] = useState<AssetForm>(emptyAssetForm())
  const [keep, setKeep] = useState<Img[]>([])
  const [newFiles, setNewFiles] = useState<File[]>([])
  const [editKey, setEditKey] = useState(0)
  const [delId, setDelId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false) // 모바일·태블릿: 등록창 열림 여부
  useEffect(() => { if (!admin) setShowForm(false) }, [admin])

  const previews = useObjectUrls(files)
  const newUrls = useObjectUrls(newFiles)
  const categories = useMemo(() => uniq([...ASSET_CATEGORIES, ...assets.map((a) => a.category || '').filter(Boolean)]), [assets])

  useEffect(() => {
    if (openId) { setSel({ id: openId, mode: 'view', idx: 0 }); onOpened() }
  }, [openId, onOpened])

  const current = sel ? assets.find((a) => a.id === sel.id) : undefined
  useEffect(() => { if (sel && !current) setSel(null) }, [sel, current])
  // 관리자 모드를 끄면 수정 중이던 패널은 상세 보기로 돌아감
  useEffect(() => { if (!admin && sel?.mode === 'edit') setSel({ ...sel, mode: 'view' }) }, [admin, sel])

  const set = <K extends keyof AssetForm>(k: K, v: AssetForm[K]) => setForm((f) => ({ ...f, [k]: v }))
  const setE = <K extends keyof AssetForm>(k: K, v: AssetForm[K]) => setEf((f) => ({ ...f, [k]: v }))

  const submit = async () => {
    setBusy(true)
    try {
      await createAsset(form, files)
      notify('자산이 등록되었습니다')
      setForm(emptyAssetForm()); setFiles([]); setFileKey((k) => k + 1)
      setShowForm(false)
    } catch (e: any) {
      notify('등록 중 오류: ' + (e?.message || e), true)
    } finally {
      await onChanged()
      setBusy(false)
    }
  }

  const startEdit = (a: Asset) => {
    setEf(assetToForm(a)); setKeep([...a.images]); setNewFiles([]); setEditKey((k) => k + 1)
    setSel({ id: a.id, mode: 'edit', idx: 0 })
  }

  const saveEdit = async () => {
    if (!current) return
    setBusy(true)
    try {
      const removed = current.images.filter((i) => !keep.some((k) => k.id === i.id))
      await updateAsset(current.id, ef, removed, newFiles)
      notify('수정되었습니다')
      await onChanged()
      setSel({ id: current.id, mode: 'view', idx: 0 })
    } catch (e: any) {
      notify('수정 중 오류: ' + (e?.message || e), true)
    } finally { setBusy(false) }
  }

  const delTarget = delId ? assets.find((a) => a.id === delId) : undefined
  const doDelete = async () => {
    if (!delTarget) return
    setBusy(true)
    try {
      await deleteAsset(delTarget)
      notify('삭제되었습니다')
      if (sel?.id === delTarget.id) setSel(null)
      setDelId(null)
      await onChanged()
    } catch (e: any) {
      notify('삭제 중 오류: ' + (e?.message || e), true)
    } finally { setBusy(false) }
  }

  const exportXlsx = async () => {
    if (assets.length === 0) return notify('내보낼 자산이 없습니다', true)
    const XLSX = await import('xlsx')
    const rows = assets.map((a) => ({
      '자산명': a.name, '카테고리': a.category, '위치': a.location, '상태': a.status,
      '구입가격': a.purchase_price, '구입처': a.purchase_place, '잔존가치': a.residual_value, '담당자': a.manager,
      '등록일자': a.registered_date, '폐기일자': a.disposal_date,
    }))
    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, '자산목록')
    XLSX.writeFile(wb, `자산목록_${new Date().toISOString().slice(0, 10)}.xlsx`)
  }

  const formFields = (f: AssetForm, s: <K extends keyof AssetForm>(k: K, v: AssetForm[K]) => void) => (
    <>
      <Field label={<>자산명<Req /></>}><input className="a-inp" value={f.name} onChange={(e) => s('name', e.target.value)} /></Field>
      <ScrollPicker label="카테고리" options={categories} value={f.category} onChange={(v) => s('category', v)} allowAdd addPlaceholder="새 카테고리" />
      <ScrollPicker label="상태" options={ASSET_STATUS} value={f.status} onChange={(v) => s('status', v)} />
      <Field label="위치"><input className="a-inp" value={f.location} onChange={(e) => s('location', e.target.value)} /></Field>
      <div className="a-two">
        <Field label="구입가격"><input className="a-inp" inputMode="decimal" value={f.purchase_price} onChange={(e) => s('purchase_price', e.target.value)} /></Field>
        <Field label="구입처"><input className="a-inp" value={f.purchase_place} onChange={(e) => s('purchase_place', e.target.value)} /></Field>
      </div>
      <div className="a-two">
        <Field label="잔존가치"><input className="a-inp" inputMode="decimal" value={f.residual_value} onChange={(e) => s('residual_value', e.target.value)} /></Field>
        <Field label="담당자"><input className="a-inp" value={f.manager} onChange={(e) => s('manager', e.target.value)} /></Field>
      </div>
      <div className="a-two">
        <Field label="등록일자"><input className="a-inp" type="date" value={f.registered_date} onChange={(e) => s('registered_date', e.target.value)} /></Field>
        <Field label="폐기일자"><input className="a-inp" type="date" value={f.disposal_date} onChange={(e) => s('disposal_date', e.target.value)} /></Field>
      </div>
    </>
  )

  const count = (k: string) => assets.filter((a) => a.status === k).length

  let left: ReactNode
  if (current && sel?.mode === 'edit') {
    left = (
      <aside className="n-panel a-form a-sheet editing">
        <div className="a-sheethead">
          <span>자산 수정</span>
          <button className="a-close" onClick={() => setSel({ id: current.id, mode: 'view', idx: 0 })} aria-label="닫기">×</button>
        </div>
        <div className="n-ct">· 자산 수정</div>
        <div className="a-rule" />
        {formFields(ef, setE)}
        <PhotoEditor
          keep={keep} onRemoveKeep={(id) => setKeep(keep.filter((k) => k.id !== id))}
          newUrls={newUrls} onRemoveNew={(i) => setNewFiles(newFiles.filter((_, k) => k !== i))}
          onPick={(fs) => { setNewFiles([...newFiles, ...fs]); setEditKey((k) => k + 1) }} inputKey={editKey}
        />
        <div className="a-actions">
          <button className="a-btn-ghost" onClick={() => setSel({ id: current.id, mode: 'view', idx: 0 })}>취소</button>
          <button className="a-btn" onClick={saveEdit} disabled={busy}>{busy ? '저장 중…' : '저장'}</button>
        </div>
      </aside>
    )
  } else if (current && sel) {
    left = (
      <aside className="n-panel a-form a-sheet">
        <div className="a-sheethead">
          <span>자산 상세</span>
          <button className="a-close" onClick={() => setSel(null)} aria-label="닫기">×</button>
        </div>
        <div className="n-ctl">
          <div className="n-ct">· 자산 상세</div>
          {admin && <button className="a-btn-ghost sm" onClick={() => setSel(null)}>＋ 새 자산 등록</button>}
        </div>
        <div className="a-rule" />
        <Gallery images={current.images} idx={sel.idx} onIdx={(i) => setSel({ ...sel, idx: i })} />
        <div className="a-h3" style={{ margin: '16px 0 14px', fontSize: 18 }}>{current.name}</div>
        <dl className="a-dl">
          <Row k="카테고리">{current.category}</Row>
          <Row k="상태"><StatTag status={current.status} kind="asset" /></Row>
          <Row k="위치">{current.location}</Row>
          <Row k="구입가격">{current.purchase_price != null ? fmt(current.purchase_price) + '원' : ''}</Row>
          <Row k="잔존가치">{current.residual_value != null ? fmt(current.residual_value) + '원' : ''}</Row>
          <Row k="구입처">{current.purchase_place}</Row>
          <Row k="담당자">{current.manager}</Row>
          <Row k="등록일자">{current.registered_date}</Row>
          <Row k="폐기일자">{current.disposal_date}</Row>
        </dl>
        {admin ? (
          <div className="a-actions">
            <button className="a-btn-ghost" onClick={() => startEdit(current)}>수정</button>
            <button className="a-btn a-btn-danger" onClick={() => setDelId(current.id)}>삭제</button>
          </div>
        ) : (
          <div className="a-hint" style={{ marginTop: 16 }}>수정·삭제는 관리자 모드에서 가능합니다.</div>
        )}
      </aside>
    )
  } else if (admin) {
    left = (
      <aside className={`n-panel a-form a-reg ${showForm ? 'is-open' : ''}`}>
        <div className="a-sheethead">
          <span>자산 등록</span>
          <button className="a-close" onClick={() => setShowForm(false)} aria-label="닫기">×</button>
        </div>
        <div className="n-ct">· 자산 등록</div>
        <div className="a-rule" />
        {formFields(form, set)}
        <Field label="사진">
          <input key={fileKey} type="file" multiple accept="image/*" className="a-file" onChange={(e) => setFiles(Array.from(e.target.files || []))} />
        </Field>
        <Previews urls={previews} />
        <button className="a-btn" onClick={submit} disabled={busy}>{busy ? '처리 중…' : '자 산 등 록'}</button>
      </aside>
    )
  } else {
    left = null
  }

  return (
    <>
      <PageHead
        eyebrow="Asset Register" title="자산 관리"
        sub={<>총 <b>{assets.length}</b>건 &nbsp;·&nbsp; 정상 <b>{count('정상')}</b> &nbsp;·&nbsp; 수리중 <b>{count('수리중')}</b> &nbsp;·&nbsp; 대여중 <b>{count('대여중')}</b> &nbsp;·&nbsp; 폐기 <b>{count('폐기')}</b></>}
        right={<AdminCtl on={admin} onToggle={onToggleAdmin} />}
      />
      {admin && <button className="a-addbtn" onClick={() => { setSel(null); setShowForm(true) }}>＋ 자산 등록</button>}
      <div className={`a-grid ${left ? '' : 'no-form'}`}>
        {left}
        <section>
          <div className="n-ctl" style={{ marginBottom: 12 }}>
            <div className="a-note" style={{ margin: 0, color: admin ? undefined : 'var(--muted)' }}>
              {admin ? '관리자 모드 — 오른쪽 끝의 수정·삭제 버튼을 사용하세요. ' : ''}자산명을 누르면 상세 정보가 나타납니다.{admin ? '' : ' 등록·수정·삭제는 관리자 모드에서 가능합니다.'}
            </div>
            <button className="a-btn-ghost" onClick={exportXlsx}>📥 자산 엑셀 다운로드</button>
          </div>
          <div className="n-card" style={{ padding: 0, overflowX: 'auto' }}>
            <table className="n-table">
              <thead>
                <tr>
                  <th>자산명</th><th>위치</th><th>상태</th><th className="r">구입가 / 잔존</th><th>구입처</th><th>등록일자</th>
                  {admin && <th>관리</th>}
                </tr>
              </thead>
              <tbody>
                {assets.map((a) => (
                  <tr key={a.id} className={sel?.id === a.id ? 'sel' : ''}>
                    <td>
                      <button className="n-link" onClick={() => setSel({ id: a.id, mode: 'view', idx: 0 })}>{a.name}</button>
                      <small>{a.category}</small>
                    </td>
                    <td>{a.location}</td>
                    <td><StatTag status={a.status} kind="asset" /></td>
                    <td className="r">{fmt(a.purchase_price)} / {fmt(a.residual_value)}</td>
                    <td>{a.purchase_place}</td>
                    <td className="nw">{a.registered_date || '-'}</td>
                    {admin && (
                      <td className="nw">
                        <button className="a-btn-ghost sm" onClick={() => startEdit(a)}>수정</button>{' '}
                        <button className="a-btn-ghost sm danger" onClick={() => setDelId(a.id)}>삭제</button>
                      </td>
                    )}
                  </tr>
                ))}
                {assets.length === 0 && (<tr><td colSpan={7}><div className="a-empty">등록된 자산이 없습니다.</div></td></tr>)}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {delTarget && (
        <ModalShell small onClose={() => setDelId(null)}>
          <div className="a-eyebrow">Delete</div>
          <h3 className="a-h3">자산 삭제</h3>
          <div className="a-rule" />
          <p style={{ fontSize: 14, lineHeight: 1.7, margin: '0 0 14px' }}>
            ‘<b>{delTarget.name}</b>’ 을(를) 삭제합니다.<br />
            <span style={{ color: 'var(--red)', fontSize: 13 }}>사진도 함께 지워지며 되돌릴 수 없습니다.</span>
          </p>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button className="a-btn-ghost" onClick={() => setDelId(null)}>취소</button>
            <button className="a-btn a-btn-danger" style={{ width: 'auto', padding: '9px 22px' }} onClick={doDelete} disabled={busy}>{busy ? '삭제 중…' : '삭제 확인'}</button>
          </div>
        </ModalShell>
      )}
    </>
  )
}
