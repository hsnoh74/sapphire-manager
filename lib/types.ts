export type Img = { id: string; url: string; path: string | null; created_at?: string }

export type Product = {
  id: string
  created_at: string
  product_name: string
  boule_id: string | null
  category: string | null
  status: string | null
  application: string[] | null
  customer: string | null
  price: number | null
  stock_location: string | null
  memo: string | null
  images: Img[]
}

export type Asset = {
  id: string
  created_at: string
  name: string
  category: string | null
  status: string | null
  location: string | null
  purchase_price: number | null
  purchase_place: string | null
  residual_value: number | null
  manager: string | null
  registered_date: string | null
  disposal_date: string | null
  images: Img[]
}

export type ProductForm = {
  product_name: string
  boule_id: string
  category: string
  status: string
  application: string[]
  customer: string
  price: string
  stock_location: string
  memo: string
}

export type AssetForm = {
  name: string
  category: string
  status: string
  location: string
  purchase_price: string
  purchase_place: string
  residual_value: string
  manager: string
  registered_date: string
  disposal_date: string
}

export const PRODUCT_CATEGORIES = ['웨이퍼', '잉곳', '블록', '기타']
export const PRODUCT_STATUS = ['재고', '판매중', '출하완료']
export const APPLICATIONS = ['LED 기판', '반도체 기판', '광학 윈도우', '시계 글라스', '카메라 렌즈 커버', '기타']
export const ASSET_CATEGORIES = ['성장로', '가공장비', '계측기', '차량', 'SW라이선스']
export const ASSET_STATUS = ['정상', '수리중', '대여중', '폐기']

export const todayStr = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export const emptyProductForm = (): ProductForm => ({
  product_name: '', boule_id: '', category: '웨이퍼', status: '재고', application: [],
  customer: '', price: '', stock_location: '', memo: '',
})

export const emptyAssetForm = (): AssetForm => ({
  name: '', category: '성장로', status: '정상', location: '', purchase_price: '', purchase_place: '',
  residual_value: '', manager: '', registered_date: todayStr(), disposal_date: '',
})

export const productToForm = (p: Product): ProductForm => ({
  product_name: p.product_name, boule_id: p.boule_id || '', category: p.category || '', status: p.status || '',
  application: [...(p.application || [])], customer: p.customer || '',
  price: p.price == null ? '' : String(p.price), stock_location: p.stock_location || '', memo: p.memo || '',
})

export const assetToForm = (a: Asset): AssetForm => ({
  name: a.name, category: a.category || '', status: a.status || '', location: a.location || '',
  purchase_price: a.purchase_price == null ? '' : String(a.purchase_price), purchase_place: a.purchase_place || '',
  residual_value: a.residual_value == null ? '' : String(a.residual_value), manager: a.manager || '',
  registered_date: a.registered_date || '', disposal_date: a.disposal_date || '',
})
