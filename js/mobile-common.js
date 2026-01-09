/**
 * KSI OSP Mobile - Common JavaScript
 */

const MobileApp = (function() {
    'use strict';

    // 오프라인 상태 관리
    let isOnline = navigator.onLine;
    let pendingSync = [];

    // 초기화
    function init() {
        initOfflineHandler();
        initServiceWorker();
        loadPendingSync();
    }

    // 오프라인 핸들러
    function initOfflineHandler() {
        window.addEventListener('online', function() {
            isOnline = true;
            hideOfflineBanner();
            syncPendingData();
        });

        window.addEventListener('offline', function() {
            isOnline = false;
            showOfflineBanner();
        });

        if (!isOnline) {
            showOfflineBanner();
        }
    }

    function showOfflineBanner() {
        const banner = document.querySelector('.offline-banner');
        if (banner) banner.classList.add('show');
    }

    function hideOfflineBanner() {
        const banner = document.querySelector('.offline-banner');
        if (banner) banner.classList.remove('show');
    }

    // Service Worker 등록
    function initServiceWorker() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('./sw.js').catch(function(err) {
                console.log('SW registration failed:', err);
            });
        }
    }

    // 동기화 대기 데이터 관리
    function loadPendingSync() {
        try {
            const data = localStorage.getItem('pendingSync');
            pendingSync = data ? JSON.parse(data) : [];
        } catch (e) {
            pendingSync = [];
        }
    }

    function savePendingSync() {
        localStorage.setItem('pendingSync', JSON.stringify(pendingSync));
    }

    function addToPendingSync(type, data) {
        pendingSync.push({
            id: Date.now(),
            type: type,
            data: data,
            timestamp: new Date().toISOString()
        });
        savePendingSync();
        showToast('오프라인 저장됨. 연결 시 동기화됩니다.');
    }

    function syncPendingData() {
        if (pendingSync.length === 0) return;
        
        showToast('데이터 동기화 중...');
        // 실제 서버 동기화 로직
        // 여기서는 시뮬레이션
        setTimeout(function() {
            pendingSync = [];
            savePendingSync();
            showToast('동기화 완료!');
        }, 1000);
    }

    // 사이드 메뉴
    function openSideMenu() {
        document.getElementById('sideMenuOverlay').classList.add('show');
        document.body.style.overflow = 'hidden';
    }

    function closeSideMenu() {
        document.getElementById('sideMenuOverlay').classList.remove('show');
        document.body.style.overflow = '';
    }

    // 마이페이지 드롭다운
    function toggleMypage(event) {
        event.stopPropagation();
        const dropdown = document.getElementById('mypageDropdown');
        if (dropdown) dropdown.classList.toggle('show');
    }

    // 모달
    function openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('show');
            document.body.style.overflow = 'hidden';
        }
    }

    function closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('show');
            document.body.style.overflow = '';
        }
    }

    // 토스트 메시지
    function showToast(message, duration) {
        duration = duration || 2000;
        let toast = document.querySelector('.toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.className = 'toast';
            document.body.appendChild(toast);
        }
        toast.textContent = message;
        toast.classList.add('show');
        
        setTimeout(function() {
            toast.classList.remove('show');
        }, duration);
    }

    // 확인 다이얼로그
    function confirmDialog(message) {
        return new Promise(function(resolve) {
            if (confirm(message)) {
                resolve(true);
            } else {
                resolve(false);
            }
        });
    }

    // 숫자 포맷
    function formatNumber(num) {
        if (num === null || num === undefined) return '0';
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }

    // 날짜 포맷
    function formatDate(dateStr) {
        if (!dateStr) return '-';
        const date = new Date(dateStr);
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return month + '-' + day;
    }

    function getToday() {
        return new Date().toISOString().split('T')[0];
    }

    // 로컬 스토리지 헬퍼
    function getData(key, defaultValue) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : defaultValue;
        } catch (e) {
            return defaultValue;
        }
    }

    function setData(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (e) {
            return false;
        }
    }

    // 페이지 이동
    function goTo(url) {
        location.href = url;
    }

    function goBack() {
        if (document.referrer && document.referrer.indexOf(location.hostname) > -1) {
            history.back();
        } else {
            location.href = 'm_9_1_0.html';
        }
    }

    // 공통 헤더 렌더링
    function renderHeader() {
        return '<div class="header">' +
            '<div class="header-logo"><span class="ksi">KSI</span><span class="osp">OSP</span></div>' +
            '<div class="header-right">' +
                '<a href="m_14_1_0.html" class="notification-badge">12</a>' +
                '<div class="user-icon" onclick="MobileApp.toggleMypage(event)">' +
                    '<svg viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>' +
                '</div>' +
                '<button class="menu-btn" onclick="MobileApp.openSideMenu()">☰</button>' +
            '</div>' +
            '<div class="mypage-dropdown" id="mypageDropdown">' +
                '<div class="mypage-dropdown-header"><div class="user-icon-large"><svg viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg></div></div>' +
                '<div class="mypage-dropdown-menu">' +
                    '<a href="m_1_1_0.html">정보수정</a>' +
                    '<a href="m_1_2_0.html">My주문</a>' +
                    '<a href="m_1_3_0.html">My매출</a>' +
                '</div>' +
            '</div>' +
        '</div>';
    }

    // 하단 네비게이션 렌더링
    function renderBottomNav(active) {
        const items = [
            { id: 'home', icon: '🏠', label: '홈', url: 'm_0_0_3.html' },
            { id: 'order', icon: '📋', label: '주문', url: 'm_3_1_0.html' },
            { id: 'print', icon: '🖨️', label: '인쇄', url: 'm_5_1_1.html' },
            { id: 'binding', icon: '📚', label: '제본', url: 'm_6_1_1.html' },
            { id: 'shipping', icon: '📦', label: '출고', url: 'm_7_1_1.html' }
        ];

        return '<div class="bottom-nav">' +
            items.map(function(item) {
                return '<a href="' + item.url + '" class="nav-item ' + (active === item.id ? 'active' : '') + '">' +
                    '<div class="nav-icon">' + item.icon + '</div>' + item.label +
                '</a>';
            }).join('') +
        '</div>';
    }

    // 사이드 메뉴 렌더링
    function renderSideMenu() {
        return '<div class="side-menu-overlay" id="sideMenuOverlay" onclick="MobileApp.closeSideMenu()">' +
            '<div class="side-menu" onclick="event.stopPropagation()">' +
                '<div class="side-menu-header">' +
                    '<div class="side-menu-logo"><span class="ksi">KSI</span><span class="osp">OSP</span></div>' +
                    '<button class="side-menu-close" onclick="MobileApp.closeSideMenu()">×</button>' +
                '</div>' +
                '<div class="side-menu-list">' +
                    '<a href="m_3_1_0.html" class="side-menu-item">주문</a>' +
                    '<a href="m_4_0_0.html" class="side-menu-item">생산</a>' +
                    '<a href="m_5_1_1.html" class="side-menu-item">인쇄</a>' +
                    '<a href="m_6_1_1.html" class="side-menu-item">제본</a>' +
                    '<a href="m_7_1_1.html" class="side-menu-item">출고</a>' +
                    '<a href="m_8_0_0.html" class="side-menu-item">용지</a>' +
                    '<a href="m_9_1_0.html" class="side-menu-item highlight">재고</a>' +
                    '<a href="m_10_1_0.html" class="side-menu-item">견적</a>' +
                    '<a href="m_11_1_0.html" class="side-menu-item">통계</a>' +
                    '<a href="m_12_1_0.html" class="side-menu-item">매출</a>' +
                    '<a href="m_13_1_0.html" class="side-menu-item">설정</a>' +
                '</div>' +
                '<button class="side-menu-logout" onclick="location.href=\'m_0_0_1.html\'">로그아웃</button>' +
            '</div>' +
        '</div>';
    }

    // 오프라인 배너 렌더링
    function renderOfflineBanner() {
        return '<div class="offline-banner">📴 오프라인 모드 - 저장된 데이터는 연결 시 동기화됩니다</div>';
    }

    // 클릭 외부 영역 감지
    document.addEventListener('click', function(e) {
        const dropdown = document.getElementById('mypageDropdown');
        if (dropdown && !dropdown.contains(e.target)) {
            dropdown.classList.remove('show');
        }
    });

    return {
        init: init,
        openSideMenu: openSideMenu,
        closeSideMenu: closeSideMenu,
        toggleMypage: toggleMypage,
        openModal: openModal,
        closeModal: closeModal,
        showToast: showToast,
        confirmDialog: confirmDialog,
        formatNumber: formatNumber,
        formatDate: formatDate,
        getToday: getToday,
        getData: getData,
        setData: setData,
        goTo: goTo,
        goBack: goBack,
        renderHeader: renderHeader,
        renderBottomNav: renderBottomNav,
        renderSideMenu: renderSideMenu,
        renderOfflineBanner: renderOfflineBanner,
        addToPendingSync: addToPendingSync,
        isOnline: function() { return isOnline; },
        getPendingSyncCount: function() { return pendingSync.length; }
    };
})();

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', function() {
    MobileApp.init();
});
