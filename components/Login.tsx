'use client'
import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { COMPANY } from './ui'

export function Login() {
  const [email, setEmail] = useState('')
  const [pw, setPw] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErr('')
    setBusy(true)
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: pw })
    setBusy(false)
    if (error) setErr(error.message === 'Invalid login credentials' ? '이메일 또는 비밀번호가 올바르지 않습니다.' : error.message)
  }

  return (
    <>
      <div className="n-login">
        <form onSubmit={submit} className="n-logincard">
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
            <span className="n-mark lg">A</span>
          </div>
          <div className="a-eyebrow" style={{ textAlign: 'center' }}>Sapphire Manager</div>
          <h1 className="n-title" style={{ textAlign: 'center', fontSize: 26, margin: '4px 0 4px' }}>
            <span className="n-co">{COMPANY}</span>
          </h1>
          <div className="a-count" style={{ textAlign: 'center', marginBottom: 22 }}>자산 · 판매제품 관리 시스템</div>
          <div className="a-fld">
            <span className="a-lab">이메일</span>
            <input className="a-inp" type="email" required autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="a-fld">
            <span className="a-lab">비밀번호</span>
            <input className="a-inp" type="password" required autoComplete="current-password" value={pw} onChange={(e) => setPw(e.target.value)} />
          </div>
          {err && <div className="a-err">{err}</div>}
          <button className="a-btn" style={{ marginTop: 6 }} disabled={busy}>{busy ? '로그인 중…' : '로그인'}</button>
        </form>
      </div>
      <div className="n-foot">© {new Date().getFullYear()} {COMPANY} · Sapphire Manager</div>
    </>
  )
}
