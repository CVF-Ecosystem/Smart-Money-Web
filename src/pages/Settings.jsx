import React, { useState, useEffect } from 'react';
import { DataAdapter } from '../sm-data-adapter.js';
import { Toast } from '../sm-toast.jsx';
import { IC } from '../sm-icons.jsx';
import { useApp } from '../sm-layout.jsx';

// ── Settings Page ─────────────────────────────────────────────────────────────
function Settings() {
  const { theme, setTheme, lang, setLang } = useApp();
  const [user, setUser] = useState({ name: '', email: '', role: '', initials: '' });

  useEffect(() => {
    DataAdapter.getCurrentUser().then(u => {
      if (u) setUser({ name: u.name || '', email: u.email || '', role: u.role || '', initials: u.initials || (u.email ? u.email[0].toUpperCase() : 'U') });
    });
  }, []);
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

      {/* Account — MOCK_DATA.user is the local session user object */}
      <div className="card" style={{ padding: '20px 24px' }}>
        <div className="section-title">Tài khoản</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px', background: 'var(--surface-2)', borderRadius: 10, marginBottom: 14 }}>
          <div className="user-avatar" style={{ width: 44, height: 44, fontSize: 16 }}>{user.initials}</div>
          <div>
            <div style={{ fontWeight: 600 }}>{user.name || 'Chưa cập nhật'}</div>
            <div style={{ fontSize: 13, color: 'var(--text-3)' }}>{user.email}</div>
          </div>
          <span className="badge badge-income" style={{ marginLeft: 'auto' }}>{user.role || 'Thủ quỹ'}</span>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-ghost btn-sm">{IC.edit(15)} Chỉnh sửa hồ sơ</button>
          <button className="btn btn-sm" style={{ background: 'var(--expense-light)', color: 'var(--expense)', border: '1px solid var(--expense-light)' }}>{IC.logout(15)} Đăng xuất</button>
        </div>
      </div>

      {/* Supabase info */}
      <div className="card" style={{ padding: '20px 24px', border: '1px solid var(--primary)', background: 'var(--primary-light)' }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <div style={{ color: 'var(--primary)', flexShrink: 0, marginTop: 2 }}>{IC.info(20)}</div>
          <div>
            <div style={{ fontWeight: 700, color: 'var(--primary)', marginBottom: 6 }}>Kết nối Supabase</div>
            <div style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.6 }}>
              Dữ liệu được lưu trên <strong>Supabase PostgreSQL</strong> — đồng bộ đa thiết bị, xác thực người dùng qua Supabase Auth, và bảo mật bằng Row Level Security (RLS).
            </div>
            <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
              <span className="badge badge-income">{IC.checkCircle(11)} Đã kết nối</span>
              <span style={{ fontSize: 12, color: 'var(--text-3)' }}>project: smart-money-web.supabase.co</span>
            </div>
          </div>
        </div>
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
