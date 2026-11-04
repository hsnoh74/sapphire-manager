'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { checkIsAdmin, fetchAssets, fetchProducts } from '../lib/data'
import { Asset, Product } from '../lib/types'
import { Login } from '../components/Login'
import { Dashboard } from '../components/Dashboard'
import { Products } from '../components/Products'
import { Assets } from '../components/Assets'
import { COMPANY, ModalHead, ModalShell } from '../components/ui'

type Tab = 'dash' | 'products' | 'assets'
// 선택 사항: 관리자 모드 진입 시 한 번 더 확인하는 비밀번호(실수 방지용, 보안 기능 아님).
// GitHub Secrets 에 NEXT_PUBLIC_ADMIN_PIN 을 넣으면 사용되고, 비워 두면 묻지 않습니다.
const ADMIN_PIN = process.env.NEXT_PUBLIC_ADMIN_PIN || ''

export default function Page() {
  const [authReady, setAuthReady] = useState(false)
  const [email, setEmail] = useState<string | null>(null)
  const [tab, setTab] = useState<Tab>('dash')
  const [products, setProducts] = useState<Product[]>([])
  const [assets, setAssets] = useState<Asset[]>([])
  const [loading, setLoading] = useState(false)
  const [isAdminUser, setIsAdminUser] = useState(false) // DB(admins 표)에 등록된 관리자 계정인지
  const [adminMode, setAdminMode] = useState(false) // 화면에서 관리자 모드를 켰는지
  const [pinOpen, setPinOpen] = useState(false)
  const [pin, setPin] = useState('')
  const [pinErr, setPinErr] = useState('')
  const [open, setOpen] = useState<{ kind: 'product' | 'asset'; id: string } | null>(null)
  const [toast, setToast] = useState<{ msg: string; bad: boolean } | null>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout>>()

  const notify = useCallback((msg: string, bad = false) => {
    setToast({ msg, bad })
    clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), 3200)
  }, [])

  const reload = useCallback(async () => {
    try {
      const [p, a] = await Promise.all([fetchProducts(), fetchAssets()])
      setProducts(p)
      setAssets(a)
    } catch (e: any) {
      notify('데이터를 불러오지 못했습니다: ' + (e?.message || e), true)
    }
  }, [notify])

  // 로그인 상태 확인 및 변경 감지
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setEmail(data.session?.user?.email ?? null)
      setAuthReady(true)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => setEmail(session?.user?.email ?? null))
    return () => sub.subscription.unsubscribe()
  }, [])

  // 로그인된 뒤에만 데이터 + 관리자 여부 조회 (RLS 때문에 로그인 전에는 빈 결과)
  useEffect(() => {
    if (!email) {
      setProducts([]); setAssets([]); setIsAdminUser(false); setAdminMode(false); setTab('dash')
      return
    }
    setLoading(true)
    Promise.all([reload(), checkIsAdmin().then(setIsAdminUser)]).finally(() => setLoading(false))
  }, [email, reload])

  const toggleAdmin = () => {
    if (adminMode) { setAdminMode(false); notify('관리자 모드를 껐습니다'); return }
    if (!isAdminUser) {
      notify('관리자 권한이 없는 계정입니다. 관리자에게 권한 부여를 요청하세요.', true)
      return
    }
    if (ADMIN_PIN) { setPin(''); setPinErr(''); setPinOpen(true); return }
    setAdminMode(true); notify('관리자 모드가 켜졌습니다')
  }
  const tryPin = () => {
    if (pin === ADMIN_PIN) { setPinOpen(false); setAdminMode(true); notify('관리자 모드가 켜졌습니다') }
    else setPinErr('비밀번호가 올바르지 않습니다.')
  }

  const goTab = (t: Tab) => { setTab(t); window.scrollTo(0, 0) }
  const openItem = (kind: 'product' | 'asset', id: string) => { setOpen({ kind, id }); goTab(kind === 'product' ? 'products' : 'assets') }
  const clearOpen = useCallback(() => setOpen(null), [])

  if (!authReady) return <div className="n-loading">불러오는 중…</div>
  if (!email) return <Login />

  const nav = (t: Tab, label: string) => (
    <button className={`n-nav ${tab === t ? 'on' : ''}`} onClick={() => goTab(t)}>{label}</button>
  )

  return (
    <div className="n-shell">
      <header className="n-top">
        <div className="n-wrap n-topin">
          <div className="n-brand">
            <span className="n-mark">A</span>
            <div><b>{COMPANY}</b><small>Sapphire Manager</small></div>
          </div>
          <nav className="n-navs">
            {nav('dash', '대시보드')}{nav('products', '판매제품')}{nav('assets', '자산관리')}
            <button className="n-nav out" onClick={() => supabase.auth.signOut()}>로그아웃</button>
          </nav>
        </div>
      </header>

      <main className="n-wrap">
        {loading && products.length === 0 && assets.length === 0 ? (
          <div className="n-loading">데이터를 불러오는 중…</div>
        ) : tab === 'dash' ? (
          <Dashboard products={products} assets={assets} email={email} onOpen={openItem} onTab={goTab} />
        ) : tab === 'products' ? (
          <Products
            products={products} admin={adminMode} onToggleAdmin={toggleAdmin} onChanged={reload} notify={notify}
            openId={open?.kind === 'product' ? open.id : null} onOpened={clearOpen}
          />
        ) : (
          <Assets
            assets={assets} admin={adminMode} onToggleAdmin={toggleAdmin} onChanged={reload} notify={notify}
            openId={open?.kind === 'asset' ? open.id : null} onOpened={clearOpen}
          />
        )}
      </main>

      <footer className="n-foot">© {new Date().getFullYear()} {COMPANY} · Sapphire Manager</footer>

      {pinOpen && (
        <ModalShell small onClose={() => setPinOpen(false)}>
          <ModalHead eyebrow="Administrator" title="관리자 모드" onClose={() => setPinOpen(false)} />
          <div style={{ padding: '16px 0 0' }}>
            <p style={{ fontSize: 13.5, margin: '0 0 12px', lineHeight: 1.6 }}>관리자 확인 비밀번호를 입력하세요.</p>
            <input
              className="a-inp" type="password" autoFocus value={pin} placeholder="비밀번호"
              onChange={(e) => setPin(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && tryPin()}
            />
            <div className="a-err">{pinErr}</div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 10 }}>
              <button className="a-btn-ghost" onClick={() => setPinOpen(false)}>취소</button>
              <button className="a-btn" style={{ width: 'auto', padding: '9px 22px' }} onClick={tryPin}>확인</button>
            </div>
          </div>
        </ModalShell>
      )}

      {toast && <div className={`n-toast ${toast.bad ? 'bad' : ''}`}>{toast.msg}</div>}
    </div>
  )
}
