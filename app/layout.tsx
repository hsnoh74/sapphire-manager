import './globals.css'

export const metadata = {
  title: '아즈텍 주식회사 · Sapphire Manager',
  description: '아즈텍 주식회사 판매제품 및 자산관리',
}

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
