import React, { useState, useEffect } from 'react';
import { DataAdapter } from './sm-data-adapter.js';
import { Toast } from './sm-toast.jsx';
import { IC } from './sm-icons.jsx';

const formatVND = (n) => {
  if (!n && n !== 0) return '—';
  const abs = Math.abs(n);
  if (abs >= 1e9) return (n / 1e9).toFixed(1).replace('.0', '') + ' tỷ';
  if (abs >= 1e6) return (n / 1e6).toFixed(1).replace('.0', '') + ' tr';
  return n.toLocaleString('vi-VN') + 'đ';
};

// ── Live Budget Donut ─────────────────────────────────────────────────────────
function LiveBudgetDonut({ groups, budgets, totalBudget }) {
  const allocated = groups.map(g => ({ ...g, val: Number(budgets[g.key]) || 0 }));
  const totalAlloc = allocated.reduce((s, g) => s + g.val, 0);
  const unalloc = Math.max(0, (totalBudget || 0) - totalAlloc);
  const grand = totalBudget || 1;
  const pct = totalBudget ? Math.min(Math.round(totalAlloc / totalBudget * 100), 999) : 0;

  const R = 52, r = 34, cx = 64, cy = 64;
  let angle = -Math.PI / 2;
  const arcs = [
    ...allocated.filter(g => g.val > 0),
    ...(unalloc > 0 ? [{ key: '_un', name: 'Chưa phân bổ', color: 'var(--surface-3)', val: unalloc }] : []),
  ].map(seg => {
    const ang = (seg.val / grand) * 2 * Math.PI;
    if (ang < 0.01) return null;
    const [x1, y1] = [cx + R * Math.cos(angle), cy + R * Math.sin(angle)];
    angle += ang;
    const [x2, y2] = [cx + R * Math.cos(angle), cy + R * Math.sin(angle)];
    const [xi1, yi1] = [cx + r * Math.cos(angle), cy + r * Math.sin(angle)];
    const [xi2, yi2] = [cx + r * Math.cos(angle - ang), cy + r * Math.sin(angle - ang)];
    return { ...seg, d: `M${x1} ${y1} A${R} ${R} 0 ${ang > Math.PI ? 1 : 0} 1 ${x2} ${y2} L${xi1} ${yi1} A${r} ${r} 0 ${ang > Math.PI ? 1 : 0} 0 ${xi2} ${yi2}Z` };
  }).filter(Boolean);

  const pctColor = pct > 100 ? 'var(--expense)' : pct >= 90 ? '#D97706' : 'var(--text)';

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
        <svg width={128} height={128} viewBox="0 0 128 128">
          {arcs.length === 0
            ? <circle cx={cx} cy={cy} r={(R + r) / 2} fill="none" stroke="var(--surface-3)" strokeWidth={R - r} />
            : arcs.map((a, i) => <path key={i} d={a.d} style={{ fill: a.color }} />)
          }
          <circle cx={cx} cy={cy} r={r - 1} fill="var(--surface)" />
          <text x={cx} y={cy - 5} textAnchor="middle" fontSize="10" fill="var(--text-4)">Phân bổ</text>
          <text x={cx} y={cy + 11} textAnchor="middle" fontSize="17" fontWeight="800" fill={pctColor} fontFamily="Space Grotesk,sans-serif">{pct}%</text>
        </svg>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
        {allocated.map(g => (
          <div key={g.key} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: g.color, flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: 'var(--text-2)', flex: 1 }}>{g.name}</span>
            <span style={{ fontSize: 12, fontFamily: 'Space Grotesk', fontWeight: 700 }}>{formatVND(g.val)}</span>
            <span style={{ fontSize: 11, color: 'var(--text-4)', minWidth: 28, textAlign: 'right' }}>
              {totalBudget ? Math.round(g.val / totalBudget * 100) : 0}%
            </span>
          </div>
        ))}
        {unalloc > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--border)', flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: 'var(--text-4)', flex: 1, fontStyle: 'italic' }}>Chưa phân bổ</span>
            <span style={{ fontSize: 12, fontFamily: 'Space Grotesk', fontWeight: 700, color: 'var(--text-4)' }}>{formatVND(unalloc)}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Live Salary Breakdown ─────────────────────────────────────────────────────
function SalaryBreakdown({ salary, budgets, groups }) {
  const totalAlloc = groups.reduce((s, g) => s + (Number(budgets[g.key]) || 0), 0);
  const savings = Math.max(0, (salary || 0) - totalAlloc);
  const base = salary || 1;
  const over = Math.max(0, totalAlloc - (salary || 0));
  const savingsPct = salary ? Math.round(savings / salary * 100) : 0;

  const bars = [
    ...groups.map(g => ({ color: g.color, name: g.name, val: Number(budgets[g.key]) || 0 })).filter(s => s.val > 0),
    ...(savings > 0 ? [{ color: '#059669', name: 'Tiết kiệm', val: savings }] : []),
  ];

  return (
    <div>
      {/* Stacked bar */}
      <div style={{ height: 18, borderRadius: 9, overflow: 'hidden', display: 'flex', background: 'var(--surface-3)', marginBottom: 12 }}>
        {bars.map((seg, i) => (
          <div key={i} title={seg.name + ': ' + formatVND(seg.val)} style={{
            width: Math.min(Math.round(seg.val / base * 100), 100) + '%',
            background: seg.color,
            transition: 'width 0.35s ease',
            minWidth: seg.val > 0 ? 3 : 0,
          }} />
        ))}
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {bars.map((seg, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: seg.color, flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: 'var(--text-2)', flex: 1 }}>{seg.name}</span>
            <span style={{ fontSize: 12, fontFamily: 'Space Grotesk', fontWeight: 700 }}>{formatVND(seg.val)}</span>
            <span style={{ fontSize: 10, color: 'var(--text-4)', minWidth: 26, textAlign: 'right' }}>
              {Math.round(seg.val / base * 100)}%
            </span>
          </div>
        ))}
      </div>

      {/* Advice badge */}
      <div style={{ marginTop: 12 }}>
        {over > 0 ? (
          <div style={{ padding: '8px 11px', background: 'var(--expense-light)', borderRadius: 8, fontSize: 12, color: 'var(--expense)', display: 'flex', gap: 6, alignItems: 'center' }}>
            {IC.alert(13)} Vượt thu nhập {formatVND(over)} — giảm bớt ngân sách
          </div>
        ) : savingsPct >= 20 ? (
          <div style={{ padding: '8px 11px', background: 'var(--income-light)', borderRadius: 8, fontSize: 12, color: 'var(--income)', display: 'flex', gap: 6, alignItems: 'center' }}>
            {IC.checkCircle(13)} Tốt! Tiết kiệm {savingsPct}% thu nhập
          </div>
        ) : savings > 0 ? (
          <div style={{ padding: '8px 11px', background: 'rgba(217,119,6,0.1)', borderRadius: 8, fontSize: 12, color: '#D97706', display: 'flex', gap: 6, alignItems: 'center' }}>
            {IC.alert(13)} Tiết kiệm {savingsPct}% — mục tiêu nên ≥ 20%
          </div>
        ) : null}
      </div>
    </div>
  );
}

// ── Payday Mini Calendar ──────────────────────────────────────────────────────
function PaydayCalendar({ salaryDay }) {
  const now   = new Date();
  const year  = now.getFullYear();
  const month = now.getMonth();
  const first = new Date(year, month, 1).getDay(); // 0=Sun
  const days  = new Date(year, month + 1, 0).getDate();
  const today = now.getDate();
  const payday = Math.min(salaryDay, days);

  const DAY_LABELS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
  const cells = Array(first).fill(null).concat(Array.from({ length: days }, (_, i) => i + 1));

  const daysUntilPay = payday >= today ? payday - today : days - today + payday;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <span style={{ fontSize: 12, color: 'var(--text-3)' }}>
          {now.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })}
        </span>
        <span style={{ fontSize: 11, fontWeight: 700, color: '#0D9488', background: 'rgba(13,148,136,0.1)', padding: '2px 8px', borderRadius: 6 }}>
          {daysUntilPay === 0 ? 'Hôm nay lương!' : `Còn ${daysUntilPay} ngày`}
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, textAlign: 'center' }}>
        {DAY_LABELS.map(d => (
          <div key={d} style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-4)', padding: '3px 0' }}>{d}</div>
        ))}
        {cells.map((d, i) => {
          const isToday  = d === today;
          const isPayday = d === payday;
          return (
            <div key={i} style={{
              fontSize: 11.5,
              fontWeight: isToday || isPayday ? 700 : 400,
              borderRadius: 6,
              padding: '4px 0',
              color: isPayday ? 'white' : isToday ? 'var(--primary)' : d ? 'var(--text-2)' : 'transparent',
              background: isPayday ? '#0D9488' : isToday ? 'var(--primary-light)' : 'transparent',
              position: 'relative',
            }}>
              {d || ''}
              {isPayday && !isToday && (
                <div style={{ position: 'absolute', top: 1, right: 2, width: 4, height: 4, borderRadius: '50%', background: 'white', opacity: 0.7 }} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Rule of Thumb 50/30/20 ────────────────────────────────────────────────────
function RuleCard({ salary, budgets, groups }) {
  if (!salary) return null;
  const needs  = Number(budgets.fixed  || 0) + Number(budgets.daily    || 0);
  const wants  = Number(budgets.lifestyle || 0) + Number(budgets.others || 0);
  const totalAlloc = groups.reduce((s, g) => s + (Number(budgets[g.key]) || 0), 0);
  const savings = Math.max(0, salary - totalAlloc);

  const rules = [
    { label: 'Thiết yếu', val: needs,   pct: Math.round(needs / salary * 100),   target: '≤50%', ok: needs / salary <= 0.5,    color: '#7C3AED' },
    { label: 'Linh tinh', val: wants,   pct: Math.round(wants / salary * 100),   target: '≤30%', ok: wants / salary <= 0.3,    color: '#0891B2' },
    { label: 'Tiết kiệm', val: savings, pct: Math.round(savings / salary * 100), target: '≥20%', ok: savings / salary >= 0.2,  color: '#059669' },
  ];

  return (
    <div>
      <div style={{ fontSize: 11, color: 'var(--text-4)', marginBottom: 10, fontStyle: 'italic' }}>Quy tắc 50/30/20</div>
      {rules.map(r => (
        <div key={r.label} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: r.color, flexShrink: 0 }} />
          <span style={{ fontSize: 12, color: 'var(--text-2)', flex: 1 }}>{r.label}</span>
          <span style={{ fontSize: 11, color: 'var(--text-4)' }}>{r.target}</span>
          <span style={{ fontSize: 12, fontFamily: 'Space Grotesk', fontWeight: 700, color: r.ok ? 'var(--income)' : 'var(--expense)', minWidth: 32, textAlign: 'right' }}>
            {r.pct}%
          </span>
          <span style={{ fontSize: 13 }}>{r.ok ? '✓' : '✗'}</span>
        </div>
      ))}
    </div>
  );
}

// ── Personal Category Modal ───────────────────────────────────────────────────
function PCatModal({ cat, defaultGroup, groups, onClose, onSave }) {
  const initGroup = cat?.group || defaultGroup || 'daily';
  const [form, setForm] = useState(cat
    ? { name: cat.name, color: cat.color, group: cat.group }
    : { name: '', color: '#D97706', group: initGroup });

  const COLORS = ['#7C3AED','#D97706','#0891B2','#DC2626','#059669','#0D9488','#C2410C','#DB2777','#B45309','#0369A1'];

  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal-box" style={{ maxWidth: 400 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">{cat ? 'Sửa danh mục' : 'Thêm danh mục cá nhân'}</div>
          <button className="icon-btn" style={{ border: 'none' }} onClick={onClose}>{IC.x(16)}</button>
        </div>
        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="input-group">
            <label className="input-label">Nhóm</label>
            <select className="input" value={form.group} onChange={e => setForm(f => ({...f, group: e.target.value}))}>
              {groups.map(g => <option key={g.key} value={g.key}>{g.name} — {g.desc}</option>)}
            </select>
          </div>
          <div className="input-group">
            <label className="input-label">Tên danh mục *</label>
            <input className="input" placeholder="VD: Ăn trưa, Café sáng, Thuê xe..." autoFocus
              value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))}
              onKeyDown={e => e.key === 'Enter' && form.name.trim() && onSave(form)} />
          </div>
          <div className="input-group">
            <label className="input-label">Màu sắc</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 2 }}>
              {COLORS.map(c => (
                <button key={c} onClick={() => setForm(f => ({...f, color: c}))}
                  style={{ width: 30, height: 30, borderRadius: '50%', background: c, padding: 0, cursor: 'pointer',
                    border: form.color === c ? '3px solid var(--text-2)' : '3px solid transparent',
                    boxShadow: form.color === c ? '0 0 0 2px var(--surface), 0 0 0 4px '+c : 'none',
                    transition: 'all .15s' }} />
              ))}
            </div>
            <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: form.color }} />
              <span style={{ fontSize: 13, fontWeight: 500 }}>{form.name || 'Tên danh mục'}</span>
              <span style={{ fontSize: 10, background: form.color+'18', color: form.color, padding: '1px 8px', borderRadius: 4, fontWeight: 700, marginLeft: 4 }}>
                {groups.find(g => g.key === form.group)?.name}
              </span>
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost btn-sm" onClick={onClose}>Hủy</button>
          <button className="btn btn-primary btn-sm" disabled={!form.name.trim()} onClick={() => onSave(form)}>
            {IC.check(14)} {cat ? 'Lưu thay đổi' : 'Thêm danh mục'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Personal Settings Page ────────────────────────────────────────────────────
function PersonalSettings() {
  const [data, setData] = useState(null);

  // Salary
  const [salary,    setSalary]    = useState(0);
  const [salaryDay, setSalaryDay] = useState(1);
  const [salarySaved, setSalarySaved] = useState(false);

  // Budgets
  const [totalBudget, setTotalBudget] = useState(0);
  const [budgets,     setBudgets]     = useState({});
  const [budgetSaved, setBudgetSaved] = useState(false);

  // Categories
  const [cats,       setCats]       = useState([]);
  const [catModal,   setCatModal]   = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    DataAdapter.getPersonalData().then(d => {
      setData(d);
      setSalary(d.salaryInfo?.monthlySalary || 0);
      setSalaryDay(d.salaryInfo?.salaryDay || 1);
      setTotalBudget(d.budgets?.monthly || 0);
      setBudgets({...d.budgets?.categories});
      setCats([...d.categories]);
    });
  }, []);

  if (!data) return <div style={{padding:20}}>Đang tải...</div>;
  const groups = data.categoryGroups;

  const budgetAllocated = Object.values(budgets).reduce((s, v) => s + (Number(v) || 0), 0);
  const overBudget = budgetAllocated > totalBudget;

  async function saveSalary() {
    try {
      await DataAdapter.updatePersonalSalary({ monthlySalary: salary, salaryDay });
      setSalarySaved(true);
      setTimeout(() => setSalarySaved(false), 2000);
    } catch (err) {
      Toast.error('Không thể lưu thu nhập: ' + err.message);
    }
  }

  async function saveBudgets() {
    try {
      await DataAdapter.updatePersonalBudgets({ monthly: totalBudget, categories: budgets });
      setBudgetSaved(true);
      setTimeout(() => setBudgetSaved(false), 2000);
    } catch (err) {
      Toast.error('Không thể lưu ngân sách: ' + err.message);
    }
  }

  async function handleCatSave(form) {
    try {
      if (catModal && catModal.id) {
        await DataAdapter.updatePersonalCategory(catModal.id, form);
        setCats(cs => cs.map(c => c.id === catModal.id ? {...c, ...form} : c));
      } else {
        const newCat = await DataAdapter.addPersonalCategory(form);
        setCats(cs => [...cs, newCat]);
      }
      setCatModal(null);
    } catch (err) {
      Toast.error('Không thể lưu danh mục: ' + err.message);
    }
  }

  async function handleCatDelete(id) {
    try {
      await DataAdapter.deletePersonalCategory(id);
      setCats(cs => cs.filter(c => c.id !== id));
      setDeletingId(null);
    } catch (err) {
      Toast.error('Không thể xóa danh mục: ' + err.message);
    }
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 290px', gap: 20, alignItems: 'start' }}>

      {/* ── LEFT: Forms ────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Salary */}
        <div className="card" style={{ padding: '22px 24px' }}>
          <div className="section-title">Thông tin thu nhập</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div className="input-group">
              <label className="input-label">Lương tháng (VND)</label>
              <input type="number" className="input" style={{ fontFamily: 'Space Grotesk' }}
                value={salary} onChange={e => setSalary(Number(e.target.value))} />
            </div>
            <div className="input-group">
              <label className="input-label">Ngày nhận lương hàng tháng</label>
              <select className="input" value={salaryDay} onChange={e => setSalaryDay(Number(e.target.value))}>
                {Array.from({length: 31}, (_, i) => i + 1).map(d => (
                  <option key={d} value={d}>Ngày {d}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, marginBottom: 18, flexWrap: 'wrap' }}>
            {[
              ['Lương / ngày', formatVND(salary / 30), '#0D9488'],
              ['Sau chi cố định', formatVND(Math.max(0, salary - (budgets.fixed || 0))), 'var(--primary)'],
              ['Ngân sách / ngày', formatVND(totalBudget / 30), '#D97706'],
            ].map(([lbl, val, clr]) => (
              <div key={lbl} style={{ padding: '10px 16px', background: 'var(--surface-2)', borderRadius: 9, border: '1px solid var(--border)', flex: 1, minWidth: 130 }}>
                <div style={{ fontSize: 11, color: 'var(--text-4)', marginBottom: 3 }}>{lbl}</div>
                <div style={{ fontFamily: 'Space Grotesk', fontWeight: 700, color: clr, fontSize: 15 }}>{val}</div>
              </div>
            ))}
          </div>

          <button className="btn btn-sm" style={{ background: salarySaved ? 'var(--income)' : '#0D9488', color: 'white', transition: 'background .3s' }} onClick={saveSalary}>
            {salarySaved ? <>{IC.checkCircle(14)} Đã lưu!</> : <>{IC.check(14)} Lưu thu nhập</>}
          </button>
        </div>

        {/* Monthly Budget */}
        <div className="card" style={{ padding: '22px 24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
            <div className="section-title" style={{ marginBottom: 0 }}>Ngân sách hàng tháng</div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 11.5, color: 'var(--text-4)' }}>Đã phân bổ</div>
              <div style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 16, color: overBudget ? 'var(--expense)' : 'var(--income)' }}>
                {formatVND(budgetAllocated)} / {formatVND(totalBudget)}
              </div>
            </div>
          </div>

          <div className="input-group" style={{ marginBottom: 18, maxWidth: 280 }}>
            <label className="input-label">Tổng ngân sách tháng (VND)</label>
            <input type="number" className="input" style={{ fontFamily: 'Space Grotesk' }}
              value={totalBudget} onChange={e => setTotalBudget(Number(e.target.value))} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
            {groups.map(grp => {
              const val = budgets[grp.key] || 0;
              const pct = totalBudget ? Math.min(val / totalBudget * 100, 100) : 0;
              return (
                <div key={grp.key} style={{ padding: '14px 16px', borderRadius: 10, background: 'var(--surface-2)', border: `1px solid ${grp.color}28` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}>
                    <span style={{ width: 9, height: 9, borderRadius: '50%', background: grp.color }} />
                    <span style={{ fontWeight: 700, fontSize: 13, color: grp.color }}>{grp.name}</span>
                    <span style={{ fontSize: 11, color: 'var(--text-4)', marginLeft: 'auto' }}>{pct.toFixed(0)}%</span>
                  </div>
                  <input type="number" className="input" style={{ fontFamily: 'Space Grotesk', fontSize: 14, marginBottom: 6, borderColor: grp.color+'55' }}
                    value={val || ''} placeholder="0"
                    onChange={e => setBudgets(b => ({...b, [grp.key]: Number(e.target.value)}))} />
                  <div style={{ fontSize: 11, color: 'var(--text-4)' }}>
                    ≈ {formatVND(val / 30)}/ngày · {cats.filter(c => c.group === grp.key).length} danh mục
                  </div>
                  <div className="progress-track" style={{ marginTop: 8, height: 4 }}>
                    <div className="progress-fill" style={{ width: pct + '%', background: grp.color }} />
                  </div>
                </div>
              );
            })}
          </div>

          {overBudget && (
            <div style={{ padding: '10px 14px', background: 'var(--expense-light)', borderRadius: 8, fontSize: 13, color: 'var(--expense)', marginBottom: 14, display: 'flex', gap: 8, alignItems: 'center' }}>
              {IC.alert(15)} Tổng phân bổ ({formatVND(budgetAllocated)}) vượt tổng ngân sách.
            </div>
          )}

          <button className="btn btn-sm" style={{ background: budgetSaved ? 'var(--income)' : '#0D9488', color: 'white', transition: 'background .3s' }} onClick={saveBudgets}>
            {budgetSaved ? <>{IC.checkCircle(14)} Đã lưu!</> : <>{IC.check(14)} Lưu ngân sách</>}
          </button>
        </div>

        {/* Personal Categories */}
        <div className="card" style={{ padding: '22px 24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div>
              <div className="section-title" style={{ marginBottom: 2 }}>Danh mục chi tiêu cá nhân</div>
              <div style={{ fontSize: 12.5, color: 'var(--text-3)' }}>{cats.length} danh mục · Tự do thêm / sửa / xóa</div>
            </div>
            <button className="btn btn-sm" style={{ background: '#0D9488', color: 'white' }}
              onClick={() => setCatModal({ mode: 'new' })}>
              {IC.plus(14)} Thêm danh mục
            </button>
          </div>

          {groups.map(grp => {
            const grpCats = cats.filter(c => c.group === grp.key);
            return (
              <div key={grp.key} style={{ marginBottom: 22 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, paddingBottom: 8, borderBottom: `2px solid ${grp.color}22` }}>
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: grp.color }} />
                  <span style={{ fontWeight: 700, fontSize: 13.5, color: grp.color }}>{grp.name}</span>
                  <span style={{ fontSize: 12, color: 'var(--text-4)' }}>— {grp.desc}</span>
                  <span style={{ marginLeft: 'auto', fontSize: 11.5, background: grp.color+'18', color: grp.color, padding: '2px 9px', borderRadius: 10, fontWeight: 700 }}>
                    {grpCats.length} danh mục
                  </span>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {grpCats.map(cat => (
                    <div key={cat.id} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '7px 12px', borderRadius: 8, background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                      <span style={{ width: 9, height: 9, borderRadius: '50%', background: cat.color, flexShrink: 0 }} />
                      <span style={{ fontSize: 13, fontWeight: 500 }}>{cat.name}</span>
                      <button className="icon-btn" style={{ width: 24, height: 24, border: 'none', color: 'var(--primary)', borderRadius: 5, flexShrink: 0 }}
                        onClick={() => setCatModal(cat)}>{IC.edit(11)}</button>
                      <button className="icon-btn" style={{ width: 24, height: 24, border: 'none', color: 'var(--expense)', borderRadius: 5, flexShrink: 0 }}
                        onClick={() => setDeletingId(cat.id)}>{IC.trash(11)}</button>
                    </div>
                  ))}
                  <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px', borderRadius: 8, border: `1.5px dashed ${grp.color}66`, background: 'transparent', color: grp.color, cursor: 'pointer', fontSize: 12.5, fontWeight: 600, fontFamily: 'inherit' }}
                    onClick={() => setCatModal({ mode: 'new', group: grp.key })}>
                    {IC.plus(13)} Thêm vào {grp.name}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── RIGHT: Live Preview Panel ───────────────────────────────────────── */}
      <div style={{ position: 'sticky', top: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Budget donut */}
        <div className="card" style={{ padding: '18px 20px' }}>
          <div className="section-title" style={{ marginBottom: 14 }}>Phân bổ ngân sách</div>
          <LiveBudgetDonut groups={groups} budgets={budgets} totalBudget={totalBudget} />
        </div>

        {/* Salary breakdown bar */}
        <div className="card" style={{ padding: '18px 20px' }}>
          <div className="section-title" style={{ marginBottom: 14 }}>Phân tích thu nhập</div>
          <SalaryBreakdown salary={salary} budgets={budgets} groups={groups} />
        </div>

        {/* 50/30/20 Rule */}
        <div className="card" style={{ padding: '18px 20px' }}>
          <RuleCard salary={salary} budgets={budgets} groups={groups} />
        </div>

        {/* Payday calendar */}
        <div className="card" style={{ padding: '18px 20px' }}>
          <div className="section-title" style={{ marginBottom: 12 }}>Lịch nhận lương</div>
          <PaydayCalendar salaryDay={salaryDay} />
        </div>
      </div>

      {/* Modals */}
      {catModal && (
        <PCatModal
          cat={catModal.mode === 'new' || catModal.id === undefined ? null : catModal}
          defaultGroup={catModal.group || 'daily'}
          groups={groups}
          onClose={() => setCatModal(null)}
          onSave={handleCatSave}
        />
      )}
      {deletingId && (
        <div className="modal-bg" onClick={() => setDeletingId(null)}>
          <div className="modal-box" style={{ maxWidth: 340 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">Xóa danh mục?</div>
              <button className="icon-btn" style={{ border: 'none' }} onClick={() => setDeletingId(null)}>{IC.x(16)}</button>
            </div>
            <div className="modal-body">
              <div style={{ fontSize: 13, color: 'var(--text-3)', lineHeight: 1.6 }}>
                Các giao dịch đã dùng danh mục này vẫn được giữ nguyên. Hành động này không thể hoàn tác.
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost btn-sm" onClick={() => setDeletingId(null)}>Hủy</button>
              <button className="btn btn-sm" style={{ background: 'var(--expense)', color: 'white' }}
                onClick={() => handleCatDelete(deletingId)}>
                {IC.trash(14)} Xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export { PersonalSettings };
