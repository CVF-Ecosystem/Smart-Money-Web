import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Layout & Context
import { AppProvider, Layout } from './sm-layout.jsx';
import { DataAdapter } from './sm-data-adapter.js';
import { Toast } from './sm-toast.jsx';
import { useTweaks, TweaksPanel, TweakSection, TweakColor, TweakToggle, TweakSlider } from './tweaks-panel.jsx';

// Fund pages
import { Dashboard } from './sm-dashboard.jsx';
import { Transactions } from './sm-transactions.jsx';
import { Approvals, AuditLog } from './sm-approval.jsx';

// Pages (split from God File)
import Members from './pages/Members.jsx';
import Reports from './pages/Reports.jsx';
import Categories from './pages/Categories.jsx';
import Budgets from './pages/Budgets.jsx';
import Recurring from './pages/Recurring.jsx';
import Funds from './pages/Funds.jsx';
import ImportExport from './pages/ImportExport.jsx';
import Settings from './pages/Settings.jsx';

// Personal Finance pages
import { MyWallet, DailySpend, SavingsGoals } from './sm-personal.jsx';
import { PersonalSettings } from './sm-personal-settings.jsx';

// ── Login Screen ──────────────────────────────────────────────────────────────
function LoginScreen({ onLogin }) {
  const profile = DataAdapter.getLocalProfile();
  const [email,    setEmail]    = useState(profile.email);
  const [password, setPassword] = useState(profile.password);
  const [loading,  setLoading]  = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true);
    try {
      await DataAdapter.signIn(email, password);
      onLogin();
    } catch (err) {
      Toast.error('Đăng nhập thất bại: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-screen">
      <div style={{ width: '100%', maxWidth: 420 }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: 'linear-gradient(135deg,#2563EB,#7C3AED)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="white" opacity="0.9"/>
                <circle cx="12" cy="9" r="2.5" fill="#2563EB"/>
              </svg>
            </div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 22, fontWeight: 800, color: 'white', letterSpacing: '-0.5px' }}>Smart Money</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', letterSpacing: '1px', textTransform: 'uppercase' }}>Finance Manager</div>
            </div>
          </div>
        </div>

        <div className="login-card">
          <h2 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 22, fontWeight: 700, marginBottom: 6 }}>Chào mừng trở lại 👋</h2>
          <p style={{ color: 'var(--text-3)', fontSize: 14, marginBottom: 24 }}>Đăng nhập để tiếp tục quản lý tài chính</p>

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="input-group">
              <label className="input-label">Email</label>
              <input type="email" className="input" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@company.vn" autoComplete="email" />
            </div>
            <div className="input-group">
              <label className="input-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                Mật khẩu
                <span style={{ color: 'var(--primary)', cursor: 'pointer', fontWeight: 400, fontSize: 12 }}>Quên mật khẩu?</span>
              </label>
              <input type="password" className="input" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" autoComplete="current-password" />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '12px', fontSize: 15, marginTop: 4, justifyContent: 'center' }} disabled={loading}>
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ animation: 'spin 0.8s linear infinite' }}>
                    <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                  </svg>
                  Đang đăng nhập...
                </span>
              ) : 'Đăng nhập'}
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: 'var(--text-4)', fontSize: 12 }}>
              <div style={{ flex: 1, height: 1, background: 'var(--border)' }} /> hoặc
              <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            </div>

            <button type="button" className="btn btn-ghost" style={{ width: '100%', justifyContent: 'center', fontSize: 14 }} onClick={() => Toast.info('Chưa hỗ trợ Google Login trong phiên bản hiện tại')}>
              <svg width="18" height="18" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
              Đăng nhập với Google
            </button>
          </form>

        </div>

        <div style={{ textAlign: 'center', marginTop: 20, fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>
          Powered by Supabase Auth · Deployed on Netlify
        </div>
      </div>
    </div>
  );
}

// ── Error Boundary ─────────────────────────────────────────────────────────────
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--text)' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
          <h2 style={{ color: 'var(--danger)', marginBottom: 8, fontFamily: 'Space Grotesk' }}>Đã xảy ra lỗi hệ thống!</h2>
          <p style={{ color: 'var(--text-3)', marginBottom: 24, maxWidth: 400, margin: '0 auto 24px' }}>{this.state.error?.toString()}</p>
          <button className="btn btn-primary" onClick={() => window.location.reload()}>Tải lại trang</button>
        </div>
      );
    }
    return this.props.children;
  }
}

// ── Page Router ───────────────────────────────────────────────────────────────
function PageContent() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/transactions" element={<Transactions />} />
      <Route path="/members" element={<Members />} />
      <Route path="/reports" element={<Reports />} />
      <Route path="/categories" element={<Categories />} />
      <Route path="/budgets" element={<Budgets />} />
      <Route path="/recurring" element={<Recurring />} />
      <Route path="/funds" element={<Funds />} />
      <Route path="/import" element={<ImportExport />} />
      <Route path="/settings" element={<Settings />} />
      <Route path="/approvals" element={<Approvals />} />
      <Route path="/audit" element={<AuditLog />} />
      <Route path="/my-wallet" element={<MyWallet />} />
      <Route path="/daily-spend" element={<DailySpend />} />
      <Route path="/savings" element={<SavingsGoals />} />
      <Route path="/personal-settings" element={<PersonalSettings />} />
    </Routes>
  );
}

// ── App Root ──────────────────────────────────────────────────────────────────
function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  React.useEffect(() => {
    async function checkSession() {
      try {
        const session = await DataAdapter.getSession();
        if (session) setLoggedIn(true);
      } catch (e) {
        console.error('Session check failed', e);
      } finally {
        setCheckingSession(false);
      }
    }
    checkSession();
  }, []);

  const TWEAK_DEFAULTS = {
    primaryColor: '#2563EB',
    accentColor: '#7C3AED',
    personalColor: '#0D9488',
    compactMode: false,
    fontScale: 1,
  };

  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);

  React.useEffect(() => {
    if (!t) return;
    document.documentElement.style.setProperty('--primary',       t.primaryColor);
    document.documentElement.style.setProperty('--primary-light', t.primaryColor + '18');
    document.documentElement.style.setProperty('--primary-muted', t.primaryColor + '22');
    document.documentElement.style.setProperty('--personal-raw',  t.personalColor);
  }, [t && t.primaryColor, t && t.personalColor]);

  React.useEffect(() => {
    if (loggedIn) processRecurringOnLogin();
  }, [loggedIn]);

  async function processRecurringOnLogin() {
    try {
      const created = await DataAdapter.processRecurringTransactions();
      if (created && created.length > 0) {
        setTimeout(() => Toast.success(`🔄 Đã tự động tạo ${created.length} giao dịch định kỳ`), 1000);
      }
    } catch (error) {
      console.error('Failed to process recurring transactions:', error);
    }
  }

  if (checkingSession) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-3)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 14 }}>Đang tải hệ thống...</div>
        </div>
      </div>
    );
  }

  if (!loggedIn) return <LoginScreen onLogin={() => setLoggedIn(true)} />;

  return (
    <AppProvider>
      <Layout>
        <ErrorBoundary>
          <PageContent />
        </ErrorBoundary>
      </Layout>
      <TweaksPanel title="Tweaks">
        <TweakSection label="Màu sắc" />
        <TweakColor label="Màu quỹ (xanh)" value={t && t.primaryColor}
          options={['#2563EB','#7C3AED','#059669','#DC2626','#D97706','#0891B2']}
          onChange={v => setTweak('primaryColor', v)} />
        <TweakColor label="Màu cá nhân (teal)" value={t && t.personalColor}
          options={['#0D9488','#059669','#0891B2','#7C3AED','#D97706']}
          onChange={v => setTweak('personalColor', v)} />
        <TweakSection label="Bố cục" />
        <TweakToggle label="Chế độ Compact" value={t && t.compactMode}
          onChange={v => setTweak('compactMode', v)} />
        <TweakSlider label="Cỡ chữ" value={t && t.fontScale} min={0.85} max={1.2} step={0.05}
          onChange={v => setTweak('fontScale', v)} />
      </TweaksPanel>
    </AppProvider>
  );
}

export default App;
