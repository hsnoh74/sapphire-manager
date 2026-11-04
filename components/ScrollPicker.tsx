'use client'
import { useState } from 'react'

type Props = {
  label: string
  options: string[]
  value: string | string[]
  onChange: (v: any) => void
  multi?: boolean
  allowAdd?: boolean
  addPlaceholder?: string
}

// 가로로 밀어서 고르는 선택 칩. multi 이면 복수 선택(값은 배열).
export function ScrollPicker({ label, options, value, onChange, multi, allowAdd, addPlaceholder }: Props) {
  const [custom, setCustom] = useState<string[]>([])
  const [showAdd, setShowAdd] = useState(false)
  const [newVal, setNewVal] = useState('')
  const selected = multi ? (value as string[]) : value ? [value as string] : []
  const all = Array.from(new Set([...options, ...custom, ...selected]))

  const pick = (o: string) => {
    if (multi) onChange(selected.includes(o) ? selected.filter((x) => x !== o) : [...selected, o])
    else onChange(o)
  }
  const add = () => {
    const v = newVal.trim()
    if (!v) return
    if (!all.includes(v)) setCustom([...custom, v])
    if (multi) onChange(selected.includes(v) ? selected : [...selected, v])
    else onChange(v)
    setNewVal('')
    setShowAdd(false)
  }

  return (
    <div className="a-fld">
      <span className="a-lab">{label}</span>
      <div className="a-chips">
        {all.map((o) => (
          <button type="button" key={o} onClick={() => pick(o)} className={`a-chip ${selected.includes(o) ? 'on' : ''}`}>
            {o}
          </button>
        ))}
        {allowAdd && (
          <button type="button" onClick={() => setShowAdd(!showAdd)} className="a-chip add">
            + 추가
          </button>
        )}
      </div>
      {showAdd && allowAdd && (
        <div className="a-two" style={{ gridTemplateColumns: '1fr auto', marginTop: 8 }}>
          <input
            className="a-inp"
            value={newVal}
            onChange={(e) => setNewVal(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), add())}
            placeholder={addPlaceholder || '새 항목'}
          />
          <button type="button" className="a-btn-ghost" onClick={add}>추가</button>
        </div>
      )}
    </div>
  )
}
