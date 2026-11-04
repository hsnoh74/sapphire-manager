import './globals.css'

// GitHub Pages 하위 경로(basePath)에서도 아이콘·매니페스트가 열리도록 접두사를 붙입니다.
const base = process.env.NEXT_PUBLIC_BASE_PATH || ''

export const metadata = {
  title: '아즈텍 주식회사 · Sapphire Manager',
  description: '아즈텍 주식회사 판매제품 및 자산관리',
  applicationName: '아즈텍 자산관리',
  manifest: `${base}/manifest.webmanifest`,
  icons: {
    icon: [
      { url: `${base}/icon-192.png`, sizes: '192x192', type: 'image/png' },
      { url: `${base}/icon.svg`, type: 'image/svg+xml' },
    ],
    apple: [{ url: `${base}/apple-touch-icon.png`, sizes: '180x180' }],
  },
  appleWebApp: { capable: true, title: '아즈텍', statusBarStyle: 'black-translucent' as const },
}

export const viewport = { themeColor: '#09090c' }

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;700&display=swap"
        />
      </head>
      <body>{children}</body>
    </html>
  )
}
