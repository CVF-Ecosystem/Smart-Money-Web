

import React, {  createContext, useContext, useState, useEffect  } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

// ── App Context ──────────────────────────────────────────────────────────────
const AppCtx = createContext(null);
const useApp = () => useContext(AppCtx);

const PERSONAL_PAGES = new Set(['my-wallet', 'daily-spend', 'savings', 'personal-settings']);

function AppProvider({ children }) {
  const [theme, setTheme]         = useState('light');
  const [lang, setLang]           = useState('vi');
  const [showAddTx, setShowAddTx] = useState(false);

  useEffect(() => { document.documentElement.setAttribute('data-theme', theme); }, [theme]);

  return (
    <AppCtx.Provider value={{ theme, setTheme, lang, setLang, showAddTx, setShowAddTx }}>
      {children}
    </AppCtx.Provider>
  );
}

// ── Nav Config ───────────────────────────────────────────────────────────────
const NAV_FUND = [
  { section: 'TỔNG QUAN', items: [
    { id: 'dashboard',    icon: 'grid',    label: 'Trang chủ' },
  ]},
  { section: 'QUẢN LÝ QUỸ', items: [
    { id: 'transactions', icon: 'arrows',  label: 'Giao dịch' },
    { id: 'categories',   icon: 'folder',  label: 'Danh mục' },
    { id: 'members',      icon: 'users',   label: 'Thành viên' },
    { id: 'funds',        icon: 'wallet',  label: 'Các quỹ' },
  ]},
  { section: 'PHÂN TÍCH', items: [
    { id: 'reports',      icon: 'chart',   label: 'Báo cáo' },
    { id: 'budgets',      icon: 'target',  label: 'Ngân sách' },
    { id: 'recurring',    icon: 'clock',   label: 'Định kỳ' },
  ]},
  { section: 'KIỂM SOÁT', items: [
    { id: 'approvals',    icon: 'shield',  label: 'Phê duyệt chi',     badge: 'approval' },
    { id: 'audit',        icon: 'history', label: 'Lịch sử chỉnh sửa' },
  ]},
];

const NAV_UTILITIES = [
  { section: 'TIỆN ÍCH', items: [
    { id: 'import',       icon: 'file',    label: 'Import / Export' },
    { id: 'settings',     icon: 'settings',label: 'Cài đặt' },
  ]},
];

const NAV_PERSONAL = [
  { section: '', items: [
    { id: 'my-wallet',         icon: 'creditCard', label: 'Ví của tôi' },
    { id: 'daily-spend',       icon: 'tag',        label: 'Chi tiêu hàng ngày', badge: 'pending' },
    { id: 'savings',           icon: 'piggy',      label: 'Kế hoạch & Heo đất' },
    { id: 'personal-settings', icon: 'settings',   label: 'Cài đặt cá nhân' },
  ]},
];

const PAGE_TITLES = {
  dashboard: 'Trang chủ', transactions: 'Giao dịch', categories: 'Danh mục',
  members: 'Thành viên', funds: 'Các quỹ', reports: 'Báo cáo',
  budgets: 'Ngân sách', recurring: 'Định kỳ', import: 'Import / Export',
  settings: 'Cài đặt', approvals: 'Phê duyệt chi', audit: 'Lịch sử chỉnh sửa',
  'my-wallet': 'Ví của tôi', 'daily-spend': 'Chi tiêu hàng ngày', savings: 'Kế hoạch & Heo đất',
  'personal-settings': 'Cài đặt cá nhân',
};

// ── Nav Item ─────────────────────────────────────────────────────────────────
function NavItem({ item, isPersonal, pendingCounts }) {
  const navigate = useNavigate();
  const location = useLocation();
  const path = '/' + item.id;
  const active = location.pathname === path || (location.pathname === '/' && item.id === 'dashboard');

  const badgeVal = item.badge === 'approval' ? pendingCounts.approvals
                 : item.badge === 'pending'  ? pendingCounts.pending
                 : 0;

  const activeStyle = isPersonal
    ? { background: 'rgba(13,148,136,0.2)', borderLeftColor: '#0D9488', color: '#5EEAD4' }
    : { background: 'var(--sidebar-active)', borderLeftColor: 'var(--sidebar-border)', color: '#FFF' };

  return (
    <div
      className={'nav-item' + (active ? ' active' : '')}
      style={active ? activeStyle : {}}
      onClick={() => navigate(path)}
    >
      {IC[item.icon] ? IC[item.icon](16) : IC.grid(16)}
      <span style={{ flex: 1 }}>{item.label}</span>
      {badgeVal > 0 && (
        <span style={{
          fontSize: 10, fontWeight: 800, background: isPersonal ? '#0D9488' : 'var(--expense)',
          color: 'white', minWidth: 18, height: 18, borderRadius: 9,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px',
        }}>{badgeVal}</span>
      )}
    </div>
  );
}

// ── Sidebar ──────────────────────────────────────────────────────────────────
function Sidebar({ isOpen }) {
  const [user, setUser] = useState({ name: '', role: '', initials: '' });
  const [pendingCounts, setPendingCounts] = useState({ approvals: 0, pending: 0 });

  useEffect(() => {
    async function load() {
      const currentUser = await DataAdapter.getCurrentUser();
      if (currentUser) {
        setUser({
          name: currentUser.name || currentUser.email || 'User',
          role: currentUser.role || 'Thủ quỹ',
          initials: currentUser.initials || (currentUser.email ? currentUser.email[0].toUpperCase() : 'U')
        });
      }
      
      try {
        const counts = await DataAdapter.getPendingCounts();
        setPendingCounts(counts || { approvals: 0, pending: 0 });
      } catch(e) { console.error(e); }
    }
    load();
  }, []);

  return (
    <aside className={'sidebar' + (isOpen ? ' open' : '')}>
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="white" opacity="0.9"/>
            <circle cx="12" cy="9" r="2.5" fill="#2563EB"/>
          </svg>
        </div>
        <div>
          <div className="sidebar-logo-text">Smart Money</div>
          <div className="sidebar-logo-sub">Finance Manager</div>
        </div>
      </div>

      {/* ── AREA 1: FUND MANAGEMENT ───────────────────────────────────── */}
      <nav style={{ flex: 1, padding: '6px 8px 0', overflowY: 'auto' }}>

        {/* Area 1 label */}
        <div style={{ padding: '8px 8px 4px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ height: 1, flex: 1, background: 'rgba(37,99,235,0.35)' }} />
          <span style={{ fontSize: 8.5, fontWeight: 800, letterSpacing: '1.6px', color: 'rgba(96,165,250,0.7)', textTransform: 'uppercase', flexShrink: 0 }}>
            Quản lý quỹ
          </span>
          <div style={{ height: 1, flex: 1, background: 'rgba(37,99,235,0.35)' }} />
        </div>

        {NAV_FUND.map(group => (
          <div key={group.section} className="sidebar-section">
            {group.section && (
              <div className="sidebar-section-label">{group.section}</div>
            )}
            {group.items.map(item => (
              <NavItem
                key={item.id} item={item}
                isPersonal={false}
                pendingCounts={pendingCounts}
              />
            ))}
          </div>
        ))}

        {/* ── AREA 2: PERSONAL FINANCE ─────────────────────────────────── */}
        <div style={{ margin: '14px 0 6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 8px' }}>
            <div style={{ height: 1, flex: 1, background: 'rgba(13,148,136,0.4)' }} />
            <span style={{ fontSize: 8.5, fontWeight: 800, letterSpacing: '1.6px', color: '#0D9488', textTransform: 'uppercase', flexShrink: 0 }}>
              Cá nhân
            </span>
            <div style={{ height: 1, flex: 1, background: 'rgba(13,148,136,0.4)' }} />
          </div>
          <div style={{ margin: '6px 0 2px', padding: '4px', borderRadius: 10, background: 'rgba(13,148,136,0.06)', border: '1px solid rgba(13,148,136,0.12)' }}>
            {NAV_PERSONAL[0].items.map(item => (
              <NavItem key={item.id} item={item} isPersonal={true} pendingCounts={pendingCounts} />
            ))}
          </div>
        </div>

        {/* ── TIỆN ÍCH — always last ────────────────────────────────────── */}
        {NAV_UTILITIES.map(group => (
          <div key={group.section} className="sidebar-section">
            <div className="sidebar-section-label">{group.section}</div>
            {group.items.map(item => (
              <NavItem key={item.id} item={item} isPersonal={false} pendingCounts={pendingCounts} />
            ))}
          </div>
        ))}

      </nav>

      {/* Bottom user chip */}
      <div className="sidebar-bottom">
        <div className="divider" style={{ marginBottom: '10px' }} />
        <div className="user-chip">
          <div className="user-avatar">{user.initials}</div>
          <div className="user-info">
            <div className="user-name">{user.name}</div>
            <div className="user-role">{user.role}</div>
          </div>
          <div style={{ color: 'var(--sidebar-text)', cursor: 'pointer' }} title="Đăng xuất" onClick={async () => {
            if (window.DataAdapter) {
              await window.DataAdapter.signOut();
              window.location.reload();
            } else {
              import('./sm-data-adapter.js').then(m => m.DataAdapter.signOut().then(() => window.location.reload()));
            }
          }}>
            {window.IC ? window.IC.logout(15) : null}
          </div>
        </div>
      </div>
    </aside>
  );
}

// ── Header ───────────────────────────────────────────────────────────────────
function Header({ onMenuToggle }) {
  const { theme, setTheme, setShowAddTx } = useApp();
  const location = useLocation();
  const page = location.pathname === '/' ? 'dashboard' : location.pathname.substring(1);
  const [userInitials, setUserInitials] = useState('U');
  
  useEffect(() => {
    async function load() {
      const u = await DataAdapter.getCurrentUser();
      if (u) {
        setUserInitials(u.initials || (u.email ? u.email[0].toUpperCase() : 'U'));
      }
    }
    load();
  }, []);

  const today = new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' });
  const isPersonal = PERSONAL_PAGES.has(page);

  return (
    <header className="topbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {/* Hamburger — only visible on mobile via CSS */}
        <button className="menu-toggle" onClick={onMenuToggle} title="Menu" aria-label="Mở menu">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="3" y1="6" x2="21" y2="6"/>
            <line x1="3" y1="12" x2="21" y2="12"/>
            <line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        </button>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div className="topbar-title">{PAGE_TITLES[page] || page}</div>
            <span style={{
              fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
              background: isPersonal ? 'rgba(13,148,136,0.12)' : 'var(--primary-light)',
              color: isPersonal ? '#0D9488' : 'var(--primary)',
              letterSpacing: '.4px',
            }}>
              {isPersonal ? 'Cá nhân' : 'Quỹ tập thể'}
            </span>
          </div>
          <div className="topbar-sub">{today}</div>
        </div>
      </div>
      <div className="topbar-right">
        {page === 'transactions' && (
          <button className="btn btn-primary btn-sm" onClick={() => setShowAddTx(true)}>
            {IC.plus(15)} Thêm giao dịch
          </button>
        )}
        {page === 'daily-spend' && (
          <button className="btn btn-sm" style={{ background: '#0D9488', color: 'white' }}
            onClick={() => setShowAddTx(true)}>
            {IC.plus(15)} Chi tiêu nhanh
          </button>
        )}
        <button className="icon-btn" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} title="Chuyển giao diện">
          {theme === 'light' ? IC.moon(16) : IC.sun(16)}
        </button>
        <div style={{ position: 'relative' }}>
          <button className="icon-btn" title="Thông báo">{IC.bell(16)}</button>
          <span className="notif-dot" />
        </div>
        <div className="user-avatar" style={{ width: 34, height: 34, fontSize: 12, cursor: 'pointer', borderRadius: 9, border: '2px solid var(--border)' }}>
          {userInitials}
        </div>
      </div>
    </header>
  );
}

// ── Layout ───────────────────────────────────────────────────────────────────
function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  // Auto-close sidebar on route change (mobile UX)
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  return (
    <div className="app-shell">
      {/* Mobile backdrop */}
      <div
        className={'sidebar-backdrop' + (sidebarOpen ? ' show' : '')}
        onClick={() => setSidebarOpen(false)}
      />
      <Sidebar isOpen={sidebarOpen} />
      <div className="main-area">
        <Header onMenuToggle={() => setSidebarOpen(o => !o)} />
        <main className="page-content fade-in">
          {children}
        </main>
      </div>
    </div>
  );
}

export {  AppCtx, AppProvider, useApp, Layout, PERSONAL_PAGES  };
