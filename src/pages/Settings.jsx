import React, { useState, useEffect } from 'react';
import { DataAdapter } from '../sm-data-adapter.js';
import { SupabaseService } from '../sm-supabase.js';
import { Toast } from '../sm-toast.jsx';
import { IC } from '../sm-icons.jsx';
import { useApp } from '../sm-layout.jsx';
import { SUPABASE_CONFIG_KEY } from '../supabase-config.js';

const LS_LIMIT_BYTES = 5 * 1024 * 1024;

function getLocalStorageUsedBytes() {
  let total = 0;
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    const v = localStorage.getItem(k);
    total += (k.length + v.length) * 2;
  }
  return total;
}

function Settings() {
  const { theme, setTheme, lang, setLang } = useApp();
  const [user, setUser]               = useState({ name: '', email: '', role: '', initials: '' });
  const [sbUrl, setSbUrl]             = useState('');
  const [sbKey, setSbKey]             = useState('');
  const [showKey, setShowKey]         = useState(false);
  const [connecting, setConnecting]   = useState(false);
  const [lsUsed, setLsUsed]           = useState(0);

  // Local profile editing (mock mode only)
  const [profileForm, setProfileForm] = useState({ name: '', email: '', password: '', role: '' });
  const [showPass, setShowPass]       = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);

  const isSupabase = DataAdapter.isSupabaseMode();

  useEffect(() => {
    const u = DataAdapter.getCurrentUser();
    if (u) {
      setUser({
        name: u.name || '',
        email: u.email || '',
        role: u.role || '',
        initials: u.initials || (u.email ? u.email[0].toUpperCase() : 'U'),
      });
    }

    if (!isSupabase) {
      const p = DataAdapter.getLocalProfile();
      setProfileForm({ name: p.name, email: p.email, password: p.password, role: p.role });
    }

    try {
      const saved = localStorage.getItem(SUPABASE_CONFIG_KEY);
      if (saved) {
        const config = JSON.parse(saved);
        setSbUrl(config.url || '');
        setSbKey(config.key || '');
      }
    } catch (e) { /* ignore */ }

    setLsUsed(getLocalStorageUsedBytes());
  }, []);

  function handleSaveProfile() {
    if (!profileForm.name.trim() || !profileForm.email.trim() || !profileForm.password.trim()) {
      Toast.error('Vui lòng điền đầy đủ tên, email và mật khẩu');
      return;
    }
    setSavingProfile(true);
    const initials = profileForm.name.trim().split(' ').map(w => w[0]).slice(-2).join('').toUpperCase();
    DataAdapter.updateLocalProfile({ ...profileForm, initials });
    setUser(u => ({ ...u, name: profileForm.name, email: profileForm.email, role: profileForm.role, initials }));
    Toast.success('Đã lưu hồ sơ — dùng thông tin mới để đăng nhập lần sau');
    setSavingProfile(false);
  }

  async function handleConnect() {
    if (!sbUrl.trim() || !sbKey.trim()) {
      Toast.error('Vui lòng nhập Project URL và Anon Key');
      return;
    }
    setConnecting(true);
    try {
      SupabaseService.initSupabase(sbUrl.trim(), sbKey.trim());
      await SupabaseService.testConnection();
      localStorage.setItem(SUPABASE_CONFIG_KEY, JSON.stringify({ url: sbUrl.trim(), key: sbKey.trim() }));
      Toast.success('Kết nối thành công! Đang tải lại...');
      setTimeout(() => window.location.reload(), 1200);
    } catch (err) {
      SupabaseService.resetSupabase();
      Toast.error('Kết nối thất bại: ' + err.message);
    } finally {
      setConnecting(false);
    }
  }

  function handleDisconnect() {
    localStorage.removeItem(SUPABASE_CONFIG_KEY);
    Toast.info('Đã ngắt kết nối. Đang tải lại...');
    setTimeout(() => window.location.reload(), 800);
  }

  const lsPercent = Math.min(100, Math.round((lsUsed / LS_LIMIT_BYTES) * 100));
  const lsColor   = lsPercent > 80 ? 'var(--expense)' : lsPercent > 60 ? '#D97706' : '#059669';
  const lsKB      = Math.round(lsUsed / 1024);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 640 }}>

      {/* Appearance */}
      <div className="card" style={{ padding: '20px 24px' }}>
        <div className="section-title">Giao diện</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {[['light', IC.sun(18), 'Sáng'], ['dark', IC.moon(18), 'Tối']].map(([t, icon, label]) => (
            <button key={t} onClick={() => setTheme(t)}
              style={{ padding: '14px', borderRadius: 10, border: '2px solid', cursor: 'pointer', fontWeight: 600, fontSize: 14, fontFamily: 'inherit', transition: 'all 0.15s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9,
                borderColor: theme === t ? 'var(--primary)' : 'var(--border)',
                background: theme === t ? 'var(--primary-light)' : 'transparent',
                color: theme === t ? 'var(--primary)' : 'var(--text-3)',
              }}>{icon}{label}
            </button>
          ))}
        </div>
      </div>

      {/* Language */}
      <div className="card" style={{ padding: '20px 24px' }}>
        <div className="section-title">Ngôn ngữ</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {[['vi', '🇻🇳', 'Tiếng Việt'], ['en', '🇬🇧', 'English']].map(([l, flag, label]) => (
            <button key={l} onClick={() => setLang(l)}
              style={{ padding: '14px', borderRadius: 10, border: '2px solid', cursor: 'pointer', fontWeight: 600, fontSize: 14, fontFamily: 'inherit', transition: 'all 0.15s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9,
                borderColor: lang === l ? 'var(--primary)' : 'var(--border)',
                background: lang === l ? 'var(--primary-light)' : 'transparent',
                color: lang === l ? 'var(--primary)' : 'var(--text-3)',
              }}>{flag} {label}
            </button>
          ))}
        </div>
      </div>

      {/* Local Profile — only shown in local mode */}
      {!isSupabase && (
        <div className="card" style={{ padding: '20px 24px' }}>
          <div className="section-title">Hồ sơ & Mật khẩu</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-3)', display: 'block', marginBottom: 5 }}>Họ tên</label>
                <input className="input" value={profileForm.name}
                  onChange={e => setProfileForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Nguyễn Thủ Quỹ" />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-3)', display: 'block', marginBottom: 5 }}>Chức vụ</label>
                <input className="input" value={profileForm.role}
                  onChange={e => setProfileForm(f => ({ ...f, role: e.target.value }))}
                  placeholder="Thủ quỹ" />
              </div>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-3)', display: 'block', marginBottom: 5 }}>Email đăng nhập</label>
              <input className="input" type="email" value={profileForm.email}
                onChange={e => setProfileForm(f => ({ ...f, email: e.target.value }))}
                placeholder="user@example.com" />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-3)', display: 'block', marginBottom: 5 }}>Mật khẩu</label>
              <div style={{ position: 'relative' }}>
                <input className="input" type={showPass ? 'text' : 'password'} value={profileForm.password}
                  onChange={e => setProfileForm(f => ({ ...f, password: e.target.value }))}
                  style={{ paddingRight: 36 }} placeholder="••••••" />
                <button onClick={() => setShowPass(v => !v)}
                  style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', padding: 4, display: 'flex', alignItems: 'center' }}>
                  {IC.eye(15)}
                </button>
              </div>
            </div>
            <button className="btn btn-primary btn-sm" onClick={handleSaveProfile} disabled={savingProfile}
              style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: 6 }}>
              {IC.check(15)} Lưu hồ sơ
            </button>
          </div>
        </div>
      )}

      {/* Account */}
      <div className="card" style={{ padding: '20px 24px' }}>
        <div className="section-title">Tài khoản</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px', background: 'var(--surface-2)', borderRadius: 10, marginBottom: 14 }}>
          <div className="user-avatar" style={{ width: 44, height: 44, fontSize: 16 }}>{user.initials || 'U'}</div>
          <div>
            <div style={{ fontWeight: 600 }}>{user.name || 'Chưa cập nhật'}</div>
            <div style={{ fontSize: 13, color: 'var(--text-3)' }}>{user.email}</div>
          </div>
          <span className="badge badge-income" style={{ marginLeft: 'auto' }}>{user.role || 'Thủ quỹ'}</span>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-ghost btn-sm">{IC.edit(15)} Chỉnh sửa hồ sơ</button>
          <button className="btn btn-sm"
            style={{ background: 'var(--expense-light)', color: 'var(--expense)', border: '1px solid var(--expense-light)' }}
            onClick={async () => { await DataAdapter.signOut(); window.location.reload(); }}>
            {IC.logout(15)} Đăng xuất
          </button>
        </div>
      </div>

      {/* Storage Mode Card */}
      <div className="card" style={{ padding: '20px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div className="section-title" style={{ margin: 0 }}>Lưu trữ dữ liệu</div>
          {isSupabase
            ? <span className="badge badge-income" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>{IC.checkCircle(11)} Supabase Cloud</span>
            : <span className="badge" style={{ background: 'rgba(217,119,6,0.12)', color: '#D97706', display: 'flex', alignItems: 'center', gap: 5 }}>{IC.folder(11)} Lưu cục bộ</span>
          }
        </div>

        {/* localStorage usage bar — only in local mode */}
        {!isSupabase && (
          <div style={{ marginBottom: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
              <span style={{ color: 'var(--text-2)' }}>Dung lượng localStorage</span>
              <span style={{ fontWeight: 600, color: lsColor }}>{lsKB} KB / ~5,120 KB ({lsPercent}%)</span>
            </div>
            <div style={{ height: 6, background: 'var(--surface-3)', borderRadius: 4, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: lsPercent + '%', background: lsColor, borderRadius: 4, transition: 'width 0.3s' }} />
            </div>
            {lsPercent > 80 && (
              <div style={{ marginTop: 8, fontSize: 12, color: 'var(--expense)', display: 'flex', alignItems: 'center', gap: 5 }}>
                {IC.alert(13)} Dung lượng gần đầy — cân nhắc chuyển sang Supabase hoặc xóa bớt dữ liệu
              </div>
            )}
          </div>
        )}

        {/* Connect form — local mode */}
        {!isSupabase ? (
          <div>
            <div style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.6, marginBottom: 14 }}>
              Kết nối Supabase để đồng bộ dữ liệu đa thiết bị, xác thực người dùng và bảo mật bằng Row Level Security.
              Tạo project miễn phí tại <strong>supabase.com</strong>.
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-3)', display: 'block', marginBottom: 5 }}>Project URL</label>
                <input
                  type="url"
                  placeholder="https://your-project.supabase.co"
                  value={sbUrl}
                  onChange={e => setSbUrl(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface-2)', color: 'var(--text-1)', fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-3)', display: 'block', marginBottom: 5 }}>Anon Key</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showKey ? 'text' : 'password'}
                    placeholder="eyJhbGc..."
                    value={sbKey}
                    onChange={e => setSbKey(e.target.value)}
                    style={{ width: '100%', padding: '9px 36px 9px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface-2)', color: 'var(--text-1)', fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box' }}
                  />
                  <button onClick={() => setShowKey(v => !v)}
                    style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', padding: 4, display: 'flex', alignItems: 'center' }}>
                    {IC.eye(15)}
                  </button>
                </div>
              </div>
              <button className="btn btn-primary btn-sm" onClick={handleConnect} disabled={connecting}
                style={{ alignSelf: 'flex-start', marginTop: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                {connecting ? 'Đang kết nối...' : <>{IC.zap(15)} Kết nối Supabase</>}
              </button>
            </div>
          </div>
        ) : (
          /* Connected state */
          <div>
            <div style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.6, marginBottom: 12 }}>
              Dữ liệu đang được đồng bộ lên Supabase Cloud.
            </div>
            {sbUrl && (
              <div style={{ background: 'var(--surface-2)', borderRadius: 8, padding: '10px 14px', marginBottom: 14 }}>
                <div style={{ color: 'var(--text-3)', marginBottom: 4, fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.6px' }}>Project URL</div>
                <div style={{ color: 'var(--text-1)', fontSize: 13, wordBreak: 'break-all' }}>{sbUrl}</div>
              </div>
            )}
            <button className="btn btn-sm"
              style={{ background: 'var(--expense-light)', color: 'var(--expense)', border: '1px solid var(--expense-light)', display: 'flex', alignItems: 'center', gap: 6 }}
              onClick={handleDisconnect}>
              {IC.logout(15)} Ngắt kết nối
            </button>
          </div>
        )}
      </div>

      {/* Keyboard shortcuts */}
      <div className="card" style={{ padding: '20px 24px' }}>
        <div className="section-title">Phím tắt</div>
        {[['Ctrl + N', 'Thêm giao dịch mới'], ['Alt + 1', 'Trang chủ'], ['Alt + 2', 'Giao dịch'], ['Alt + D', 'Bật/tắt Dark mode']].map(([key, action]) => (
          <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
            <span style={{ fontSize: 13, color: 'var(--text-2)' }}>{action}</span>
            <kbd style={{ fontFamily: 'Space Grotesk', fontSize: 12, background: 'var(--surface-3)', border: '1px solid var(--border)', padding: '2px 8px', borderRadius: 5, fontWeight: 600 }}>{key}</kbd>
          </div>
        ))}
      </div>

    </div>
  );
}

export default Settings;
