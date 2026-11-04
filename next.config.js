// GitHub Pages 프로젝트 사이트(https://계정.github.io/저장소명/)는 하위 경로에서 서비스되므로
// basePath가 필요합니다. 배포 워크플로가 NEXT_PUBLIC_BASE_PATH를 자동으로 설정합니다.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || ''

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: { unoptimized: true },
  trailingSlash: true,
  basePath,
}

module.exports = nextConfig
