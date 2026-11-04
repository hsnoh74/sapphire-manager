import { useEffect, useMemo } from 'react'

// File[] -> 미리보기용 임시 주소. 사용이 끝나면 자동으로 해제합니다.
export function useObjectUrls(files: File[]): string[] {
  const urls = useMemo(() => files.map((f) => URL.createObjectURL(f)), [files])
  useEffect(() => () => urls.forEach((u) => URL.revokeObjectURL(u)), [urls])
  return urls
}
