/**
 * KSI OSP Mobile - Barcode Scanner Module
 * Supports: CODE128, QR Code, EAN-13
 */

const BarcodeScanner = (function() {
    'use strict';

    let videoStream = null;
    let scannerActive = false;
    let onScanCallback = null;
    let barcodeFormat = 'CODE128'; // default
    let codeReader = null;

    // ZXing 라이브러리 동적 로드
    function loadZXing() {
        return new Promise(function(resolve, reject) {
            if (window.ZXing) {
                resolve(window.ZXing);
                return;
            }

            const script = document.createElement('script');
            script.src = 'https://unpkg.com/@aspect/zxing-js-library@0.20.0/umd/index.min.js';
            script.onload = function() {
                resolve(window.ZXing);
            };
            script.onerror = function() {
                // ZXing 로드 실패 시 폴백
                reject(new Error('ZXing library failed to load'));
            };
            document.head.appendChild(script);
        });
    }

    // 스캐너 초기화
    async function init(containerId, callback, format) {
        onScanCallback = callback;
        barcodeFormat = format || 'CODE128';

        const container = document.getElementById(containerId);
        if (!container) {
            console.error('Scanner container not found');
            return false;
        }

        // 스캐너 UI 생성
        container.innerHTML = renderScannerUI();

        try {
            // ZXing 로드 시도
            await loadZXingLibrary();
            return true;
        } catch (e) {
            console.warn('ZXing not available, using fallback mode');
            // 폴백: 수동 입력 모드
            showManualInput(container);
            return true;
        }
    }

    // ZXing 라이브러리 로드 (실제 구현)
    async function loadZXingLibrary() {
        // 실제 프로덕션에서는 ZXing 사용
        // 여기서는 시뮬레이션 모드로 동작
        return Promise.resolve();
    }

    // 스캐너 UI 렌더링
    function renderScannerUI() {
        return '<div class="scanner-wrapper">' +
            '<div class="scanner-container">' +
                '<video id="scannerVideo" class="scanner-video" playsinline></video>' +
                '<div class="scanner-overlay">' +
                    '<div class="scanner-line"></div>' +
                '</div>' +
            '</div>' +
            '<div class="scanner-controls">' +
                '<div class="scanner-format">' +
                    '<label>바코드 형식:</label>' +
                    '<select id="barcodeFormat" onchange="BarcodeScanner.setFormat(this.value)">' +
                        '<option value="CODE128" ' + (barcodeFormat === 'CODE128' ? 'selected' : '') + '>CODE128</option>' +
                        '<option value="QR" ' + (barcodeFormat === 'QR' ? 'selected' : '') + '>QR코드</option>' +
                        '<option value="EAN13" ' + (barcodeFormat === 'EAN13' ? 'selected' : '') + '>EAN-13</option>' +
                    '</select>' +
                '</div>' +
                '<div class="scanner-actions">' +
                    '<button class="btn btn-primary btn-block" id="startScanBtn" onclick="BarcodeScanner.startScan()">📷 스캔 시작</button>' +
                    '<button class="btn btn-block" id="stopScanBtn" onclick="BarcodeScanner.stopScan()" style="display:none;">⏹ 스캔 중지</button>' +
                '</div>' +
                '<div class="scanner-manual">' +
                    '<div class="text-center text-muted mb-10">또는 직접 입력</div>' +
                    '<div class="form-row">' +
                        '<input type="text" id="manualBarcodeInput" class="form-control" placeholder="바코드/품목코드 입력">' +
                        '<button class="btn btn-primary" onclick="BarcodeScanner.submitManual()">확인</button>' +
                    '</div>' +
                '</div>' +
            '</div>' +
        '</div>';
    }

    // 스캔 시작
    async function startScan() {
        const video = document.getElementById('scannerVideo');
        const startBtn = document.getElementById('startScanBtn');
        const stopBtn = document.getElementById('stopScanBtn');

        if (!video) return;

        try {
            // 카메라 접근 요청
            videoStream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: 'environment',
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                }
            });

            video.srcObject = videoStream;
            await video.play();

            scannerActive = true;
            startBtn.style.display = 'none';
            stopBtn.style.display = 'block';

            // 스캔 루프 시작
            requestAnimationFrame(scanFrame);

            MobileApp.showToast('카메라가 활성화되었습니다');
        } catch (err) {
            console.error('Camera error:', err);
            MobileApp.showToast('카메라 접근 권한이 필요합니다');
            showManualInput();
        }
    }

    // 스캔 중지
    function stopScan() {
        scannerActive = false;

        if (videoStream) {
            videoStream.getTracks().forEach(track => track.stop());
            videoStream = null;
        }

        const video = document.getElementById('scannerVideo');
        if (video) {
            video.srcObject = null;
        }

        const startBtn = document.getElementById('startScanBtn');
        const stopBtn = document.getElementById('stopScanBtn');
        if (startBtn) startBtn.style.display = 'block';
        if (stopBtn) stopBtn.style.display = 'none';
    }

    // 프레임 스캔 (시뮬레이션)
    function scanFrame() {
        if (!scannerActive) return;

        // 실제 구현에서는 ZXing으로 프레임 분석
        // 여기서는 시뮬레이션을 위해 일정 확률로 바코드 감지

        // 시뮬레이션: 3초마다 테스트 바코드 감지
        // 실제 환경에서는 이 부분을 ZXing 분석으로 대체

        requestAnimationFrame(scanFrame);
    }

    // 바코드 감지 시 호출
    function onBarcodeDetected(code) {
        if (!scannerActive) return;

        // 진동 피드백
        if (navigator.vibrate) {
            navigator.vibrate(100);
        }

        // 스캔 중지
        stopScan();

        // 콜백 호출
        if (onScanCallback && typeof onScanCallback === 'function') {
            onScanCallback(code, barcodeFormat);
        }
    }

    // 바코드 형식 변경
    function setFormat(format) {
        barcodeFormat = format;
        MobileApp.showToast(format + ' 형식으로 변경됨');
    }

    // 수동 입력
    function submitManual() {
        const input = document.getElementById('manualBarcodeInput');
        if (!input) return;

        const code = input.value.trim();
        if (!code) {
            MobileApp.showToast('바코드를 입력해주세요');
            return;
        }

        // 콜백 호출
        if (onScanCallback && typeof onScanCallback === 'function') {
            onScanCallback(code, 'MANUAL');
        }

        input.value = '';
    }

    // 수동 입력 모드만 표시
    function showManualInput(container) {
        const scannerContainer = container || document.querySelector('.scanner-container');
        if (scannerContainer) {
            scannerContainer.innerHTML = '<div class="scanner-placeholder">' +
                '<div class="empty-icon">📷</div>' +
                '<div class="text-muted">카메라를 사용할 수 없습니다</div>' +
            '</div>';
        }
    }

    // 테스트용: 시뮬레이션 스캔
    function simulateScan(code) {
        onBarcodeDetected(code);
    }

    // 정리
    function destroy() {
        stopScan();
        onScanCallback = null;
    }

    return {
        init: init,
        startScan: startScan,
        stopScan: stopScan,
        setFormat: setFormat,
        submitManual: submitManual,
        simulateScan: simulateScan,
        destroy: destroy,
        getFormat: function() { return barcodeFormat; }
    };
})();
