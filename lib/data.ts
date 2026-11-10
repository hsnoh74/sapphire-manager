import { supabase, BUCKET } from './supabase'
import { toNum } from './format'
import { Asset, AssetForm, Img, Product, ProductForm } from './types'

const byCreated = (a: Img, b: Img) => String(a.created_at || '').localeCompare(String(b.created_at || ''))
const nn = (s: string) => (s.trim() === '' ? null : s.trim())

/* ───────── 사진 업로드 / 삭제 ───────── */

// 사진을 압축한 뒤 Storage에 올립니다.
// 한글/공백 파일명은 Supabase에서 "Invalid key" 오류가 나므로 영문 난수 이름으로 바꿉니다.
async function uploadOne(file: File, folder: string): Promise<{ url: string; path: string }> {
  const { default: imageCompression } = await import('browser-image-compression')
  const comp = await imageCompression(file, { maxSizeMB: 0.3, maxWidthOrHeight: 1920, useWebWorker: true })
  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg'
  const path = `${folder}/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`
  const { error } = await supabase.storage.from(BUCKET).upload(path, comp, {
    contentType: comp.type || file.type || 'image/jpeg',
  })
  if (error) throw error
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
  return { url: data.publicUrl, path }
}

async function removeFiles(paths: (string | null)[]) {
  const list = paths.filter((p): p is string => !!p)
  if (list.length) await supabase.storage.from(BUCKET).remove(list)
}

/* ───────── 판매제품 ───────── */

function productPayload(f: ProductForm) {
  if (!f.product_name.trim()) throw new Error('판매제품명은 필수입니다')
  const price = toNum(f.price)
  if (price === undefined) throw new Error('가격은 숫자로 입력해 주세요')
  return {
    product_name: f.product_name.trim(), boule_id: nn(f.boule_id), category: f.category, status: f.status,
    application: f.application, customer: nn(f.customer), price, stock_location: nn(f.stock_location), memo: nn(f.memo),
  }
}

export async function fetchProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select('*, product_images(id,url,path,created_at)')
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data || []).map((r: any) => ({ ...r, images: [...(r.product_images || [])].sort(byCreated) })) as Product[]
}

export async function createProduct(f: ProductForm, files: File[]) {
  const payload = productPayload(f)
  const { data, error } = await supabase.from('products').insert(payload).select().single()
  if (error) throw error
  for (const file of files) {
    const up = await uploadOne(file, `products/${data.id}`)
    const { error: e2 } = await supabase.from('product_images').insert({ product_id: data.id, url: up.url, path: up.path })
    if (e2) throw e2
  }
}

export async function updateProduct(id: string, f: ProductForm, removed: Img[], newFiles: File[]) {
  const payload = productPayload(f)
  const { data, error } = await supabase.from('products').update(payload).eq('id', id).select('id')
  if (error) throw error
  if (!data || !data.length) throw new Error('수정 권한이 없습니다. 관리자로 지정된 계정이 필요합니다.')
  for (const img of removed) {
    const { error: e } = await supabase.from('product_images').delete().eq('id', img.id)
    if (e) throw e
  }
  await removeFiles(removed.map((i) => i.path))
  for (const file of newFiles) {
    const up = await uploadOne(file, `products/${id}`)
    const { error: e2 } = await supabase.from('product_images').insert({ product_id: id, url: up.url, path: up.path })
    if (e2) throw e2
  }
}

export async function deleteProduct(p: Product) {
  const { data, error } = await supabase.from('products').delete().eq('id', p.id).select('id')
  if (error) throw error
  if (!data || !data.length) throw new Error('삭제 권한이 없습니다. 관리자로 지정된 계정이 필요합니다.')
  await removeFiles(p.images.map((i) => i.path)) // 사진 행은 DB가 자동 삭제(cascade), 파일은 여기서 정리
}

/* ───────── 자산 ───────── */

function assetPayload(f: AssetForm) {
  if (!f.name.trim()) throw new Error('자산명은 필수입니다')
  const purchase_price = toNum(f.purchase_price)
  const residual_value = toNum(f.residual_value)
  if (purchase_price === undefined || residual_value === undefined) throw new Error('구입가격/잔존가치는 숫자로 입력해 주세요')
  if (f.registered_date && f.disposal_date && f.disposal_date < f.registered_date)
    throw new Error('폐기일자는 등록일자보다 빠를 수 없습니다')
  return {
    name: f.name.trim(), category: f.category, status: f.status, location: nn(f.location),
    purchase_price, purchase_place: nn(f.purchase_place), residual_value, manager: nn(f.manager),
    registered_date: nn(f.registered_date), disposal_date: nn(f.disposal_date),
  }
}

export async function fetchAssets(): Promise<Asset[]> {
  const { data, error } = await supabase
    .from('assets')
    .select('*, asset_images(id,url,path,created_at)')
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data || []).map((r: any) => ({ ...r, images: [...(r.asset_images || [])].sort(byCreated) })) as Asset[]
}

export async function createAsset(f: AssetForm, files: File[]) {
  const payload = assetPayload(f)
  const { data, error } = await supabase.from('assets').insert(payload).select().single()
  if (error) throw error
  for (const file of files) {
    const up = await uploadOne(file, `assets/${data.id}`)
    const { error: e2 } = await supabase.from('asset_images').insert({ asset_id: data.id, url: up.url, path: up.path })
    if (e2) throw e2
  }
}

export async function updateAsset(id: string, f: AssetForm, removed: Img[], newFiles: File[]) {
  const payload = assetPayload(f)
  const { data, error } = await supabase.from('assets').update(payload).eq('id', id).select('id')
  if (error) throw error
  if (!data || !data.length) throw new Error('수정 권한이 없습니다. 관리자로 지정된 계정이 필요합니다.')
  for (const img of removed) {
    const { error: e } = await supabase.from('asset_images').delete().eq('id', img.id)
    if (e) throw e
  }
  await removeFiles(removed.map((i) => i.path))
  for (const file of newFiles) {
    const up = await uploadOne(file, `assets/${id}`)
    const { error: e2 } = await supabase.from('asset_images').insert({ asset_id: id, url: up.url, path: up.path })
    if (e2) throw e2
  }
}

export async function deleteAsset(a: Asset) {
  const { data, error } = await supabase.from('assets').delete().eq('id', a.id).select('id')
  if (error) throw error
  if (!data || !data.length) throw new Error('삭제 권한이 없습니다. 관리자로 지정된 계정이 필요합니다.')
  await removeFiles(a.images.map((i) => i.path))
}

/* ───────── 관리자 여부 (DB의 admins 표 기준) ───────── */
export async function checkIsAdmin(): Promise<boolean> {
  const { data, error } = await supabase.rpc('is_admin')
  return !error && data === true
}

/* 관리자 모드 비밀번호 확인 — 비밀번호는 DB(해시)에서만 검사하므로 화면 코드에 들어 있지 않습니다 */
export async function checkAdminPin(pin: string): Promise<boolean> {
  const { data, error } = await supabase.rpc('check_admin_pin', { p: pin })
  if (error) throw new Error(error.message)
  return data === true
}
