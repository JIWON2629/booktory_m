#!/bin/bash
# PWA 아이콘 생성 스크립트
# 실제 프로덕션에서는 디자인 도구로 PNG 아이콘을 만들어야 합니다.
# 여기서는 placeholder SVG를 생성합니다.

ICONS_DIR="./icons"

# 메인 아이콘 SVG
create_icon() {
    local size=$1
    cat > "${ICONS_DIR}/icon-${size}x${size}.svg" << 'EOF'
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="80" fill="#1a5dad"/>
  <text x="256" y="200" text-anchor="middle" font-family="Arial" font-size="120" font-weight="bold" font-style="italic" fill="white">KSI</text>
  <rect x="156" y="240" width="200" height="60" rx="10" fill="#ff6b35"/>
  <text x="256" y="285" text-anchor="middle" font-family="Arial" font-size="40" font-weight="bold" fill="white">OSP</text>
  <text x="256" y="380" text-anchor="middle" font-family="Arial" font-size="60" fill="white">📦</text>
</svg>
EOF
}

# 각 크기별 아이콘 생성 (SVG는 크기 무관하지만 파일명 구분용)
for size in 72 96 128 144 152 192 384 512; do
    create_icon $size
done

# favicon
cp "${ICONS_DIR}/icon-32x32.svg" "${ICONS_DIR}/favicon-32x32.svg" 2>/dev/null || create_icon 32
cp "${ICONS_DIR}/icon-16x16.svg" "${ICONS_DIR}/favicon-16x16.svg" 2>/dev/null || create_icon 16

# Apple Touch Icon
cp "${ICONS_DIR}/icon-180x180.svg" "${ICONS_DIR}/apple-touch-icon.svg" 2>/dev/null || create_icon 180

echo "SVG 아이콘 생성 완료"
echo "참고: 실제 배포 시에는 PNG 파일로 변환해야 합니다."
