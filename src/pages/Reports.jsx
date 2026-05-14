import React, { useState, useEffect } from 'react';
import { DataAdapter } from '../sm-data-adapter.js';
import { Toast } from '../sm-toast.jsx';
import { IC } from '../sm-icons.jsx';
import { formatVND, formatVNDFull } from '../sm-data.js';
import { MOCK_DATA } from '../sm-data.js';

// ── PDF Export ────────────────────────────────────────────────────────────────
// exportPDF receives live data from Reports component — no MOCK_DATA dependency
function exportPDF(liveTransactions, liveCategories, liveMembers) {
  const transactions = liveTransactions || MOCK_DATA.transactions;
  const categories   = liveCategories   || MOCK_DATA.categories;
  const members      = liveMembers      || MOCK_DATA.members;

  const currentYear = new Date().getFullYear();
  const escapeHTML = (str) => String(str).replace(/[&<>'"]/g, 
    tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
  );

  // Build monthly chart from real transactions
  const months = ['T1','T2','T3','T4','T5','T6','T7','T8','T9','T10','T11','T12'];
  const monthlyChart = months.map((label, i) => {
    const prefix = `${currentYear}-${String(i+1).padStart(2,'0')}`;
    const income  = transactions.filter(t => t.type==='income'  && t.date.startsWith(prefix)).reduce((s,t)=>s+t.amount,0);
    const expense = transactions.filter(t => t.type==='expense' && t.date.startsWith(prefix)).reduce((s,t)=>s+t.amount,0);
    return { month: label, income, expense };
  });

  const totalIncome  = monthlyChart.reduce((s,r) => s+r.income,  0);
  const totalExpense = monthlyChart.reduce((s,r) => s+r.expense, 0);
  const balance      = transactions.filter(t=>t.type==='income').reduce((s,t)=>s+t.amount,0)
                     - transactions.filter(t=>t.type==='expense').reduce((s,t)=>s+t.amount,0)
                     + (MOCK_DATA.fundAccount.initialBalance || 0);

  const expCats = categories.filter(c => c.type === 'expense');
  const catRows = expCats.map(cat => {
    const catId = cat.id;
    const total = transactions
      .filter(t => t.type === 'expense' && (t.categoryId === catId || t.category_id === catId))
      .reduce((s,t) => s+t.amount, 0);
    return { ...cat, total };
  }).filter(c => c.total > 0).sort((a,b) => b.total - a.total);

  const fundName = escapeHTML(MOCK_DATA.fundAccount?.name || 'Quỹ chính');
  const userName = escapeHTML(MOCK_DATA.user?.name || 'Thủ quỹ');
  const today    = new Date().toLocaleDateString('vi-VN');

  const w = window.open('', '_blank', 'width=860,height=720');
  w.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8">
  <title>Báo cáo tài chính Smart Money</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:Arial,sans-serif;padding:36px;color:#1e293b;font-size:13px;line-height:1.5}
    .header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:28px;padding-bottom:16px;border-bottom:2px solid #2563eb}
    .logo{font-size:22px;font-weight:800;color:#1e3a5f}
    .sub{font-size:12px;color:#64748b;margin-top:2px}
    .meta{text-align:right;font-size:12px;color:#64748b}
    .stats{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-bottom:28px}
    .stat{padding:16px;border:1px solid #e2e8f0;border-radius:8px;text-align:center}
    .stat-lbl{font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px}
    .stat-val{font-size:20px;font-weight:800}
    .green{color:#059669}.red{color:#dc2626}.blue{color:#2563eb}
    .section{font-size:15px;font-weight:700;margin:24px 0 10px;color:#0f172a;padding-bottom:6px;border-bottom:2px solid #e2e8f0}
    table{width:100%;border-collapse:collapse;margin-bottom:24px}
    th{background:#f8fafc;padding:9px 12px;text-align:left;font-size:10px;text-transform:uppercase;letter-spacing:.5px;color:#64748b;border-bottom:2px solid #e2e8f0}
    td{padding:9px 12px;border-bottom:1px solid #f1f5f9;font-size:12px;vertical-align:middle}
    tr:last-child td{border-bottom:none}
    .right{text-align:right}.bold{font-weight:700}
    .badge{display:inline-block;padding:2px 8px;border-radius:12px;font-size:10px;font-weight:700}
    .badge-g{background:#d1fae5;color:#059669}.badge-r{background:#fee2e2;color:#dc2626}.badge-y{background:#fef3c7;color:#d97706}
    .footer{margin-top:32px;padding-top:12px;border-top:1px solid #e2e8f0;font-size:11px;color:#94a3b8;display:flex;justify-content:space-between}
    .bar-wrap{width:140px;background:#f1f5f9;border-radius:3px;height:6px;display:inline-block}
    .bar-fill{height:6px;border-radius:3px;background:#2563eb;display:inline-block}
    @media print{body{padding:18px}.stats{break-inside:avoid}}
  </style></head><body>
  <div class="header">
    <div><div class="logo">Smart Money — Báo cáo tài chính</div>
      <div class="sub">Quỹ: ${fundName} · Thủ quỹ: ${userName}</div></div>
    <div class="meta">Ngày xuất: ${today}<br>Năm tài chính: ${currentYear}</div>
  </div>
  <div class="stats">
    <div class="stat"><div class="stat-lbl">Số dư hiện tại</div><div class="stat-val blue">${new Intl.NumberFormat('vi-VN').format(balance)} đ</div></div>
    <div class="stat"><div class="stat-lbl">Tổng thu năm</div><div class="stat-val green">${new Intl.NumberFormat('vi-VN').format(totalIncome)} đ</div></div>
    <div class="stat"><div class="stat-lbl">Tổng chi năm</div><div class="stat-val red">${new Intl.NumberFormat('vi-VN').format(totalExpense)} đ</div></div>
  </div>
  <div class="section">Thu chi theo tháng — ${currentYear}</div>
  <table><thead><tr><th>Tháng</th><th class="right">Thu vào</th><th class="right">Chi ra</th><th class="right">Chênh lệch</th><th>Tỷ lệ thu</th></tr></thead><tbody>
  ${monthlyChart.filter(r=>r.income>0||r.expense>0).map((r,i)=>{
    const bal=r.income-r.expense; const pct=r.income?(r.income/(r.income+r.expense)*100).toFixed(0):0;
    return `<tr><td class="bold">Tháng ${i+1}</td>
    <td class="right green bold">${r.income?new Intl.NumberFormat('vi-VN').format(r.income)+' đ':'—'}</td>
    <td class="right red">${r.expense?new Intl.NumberFormat('vi-VN').format(r.expense)+' đ':'—'}</td>
    <td class="right bold" style="color:${bal>=0?'#059669':'#dc2626'}">${bal>=0?'+':''}${new Intl.NumberFormat('vi-VN').format(bal)} đ</td>
    <td><div class="bar-wrap"><div class="bar-fill" style="width:${pct}%"></div></div> ${pct}%</td></tr>`;
  }).join('')}
  <tr style="background:#f8fafc;font-weight:700"><td>TỔNG CỘNG</td>
    <td class="right green">${new Intl.NumberFormat('vi-VN').format(totalIncome)} đ</td>
    <td class="right red">${new Intl.NumberFormat('vi-VN').format(totalExpense)} đ</td>
    <td class="right" style="color:${totalIncome>=totalExpense?'#059669':'#dc2626'}">${new Intl.NumberFormat('vi-VN').format(totalIncome-totalExpense)} đ</td>
    <td></td></tr>
  </tbody></table>
  <div class="section">Chi tiêu theo danh mục</div>
  <table><thead><tr><th>Mã</th><th>Danh mục</th><th class="right">Số tiền</th><th class="right">Tỷ trọng</th></tr></thead><tbody>
  ${catRows.map(c=>`<tr><td><span class="badge badge-r">${c.code}</span></td><td>${c.name}</td>
    <td class="right bold red">${new Intl.NumberFormat('vi-VN').format(c.total)} đ</td>
    <td class="right">${totalExpense>0?(c.total/totalExpense*100).toFixed(1):0}%</td></tr>`).join('')}
  </tbody></table>
  <div class="section">Tình hình nộp quỹ thành viên</div>
  <table><thead><tr><th>Mã NV</th><th>Họ tên</th><th class="right">Đã nộp</th><th class="right">Phải nộp</th><th style="text-align:center">Trạng thái</th></tr></thead><tbody>
  ${members.map(m=>`<tr><td>${m.code||''}</td><td>${m.name||''}</td>
    <td class="right bold green">${new Intl.NumberFormat('vi-VN').format(m.totalPaid||m.total_paid||0)} đ</td>
    <td class="right">${new Intl.NumberFormat('vi-VN').format(m.totalDue||m.monthly_due*10||0)} đ</td>
    <td style="text-align:center"><span class="badge ${(m.status||m.payment_status)==='paid'?'badge-g':(m.status||m.payment_status)==='partial'?'badge-y':'badge-r'}">${(m.status||m.payment_status)==='paid'?'Đủ':(m.status||m.payment_status)==='partial'?'Thiếu':'Chưa nộp'}</span></td></tr>`).join('')}
  </tbody></table>
  <div class="footer"><span>Smart Money Finance Manager · Xuất ${today}</span><span>Dữ liệu bảo mật theo RLS Supabase</span></div>
  </body></html>`);
  w.document.close();
  setTimeout(() => { w.focus(); w.print(); }, 600);
}

// ── Reports Page ─────────────────────────────────────────────────────────────
function Reports() {
  const [transactions, setTransactions] = useState([]);
  const [members, setMembers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('monthly');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const [txData, memData, catData] = await Promise.all([
        DataAdapter.getTransactions(),
        DataAdapter.getMembers(),
        DataAdapter.getCategories()
      ]);
      setTransactions(txData);
      setMembers(memData);
      setCategories(catData);
    } catch (error) {
      console.error('Failed to load reports:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
        <div style={{ textAlign: 'center', color: 'var(--text-3)' }}>
          <div style={{ fontSize: 14 }}>Đang tải báo cáo...</div>
        </div>
      </div>
    );
  }

  // Calculate monthly chart from transactions
  const monthlyChart = React.useMemo(() => {
    const months = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'];
    return months.map((month, i) => {
      const prefix = `${new Date().getFullYear()}-${String(i + 1).padStart(2, '0')}`;
      const income = transactions.filter(t => t.type === 'income' && t.date.startsWith(prefix)).reduce((s, t) => s + t.amount, 0);
      const expense = transactions.filter(t => t.type === 'expense' && t.date.startsWith(prefix)).reduce((s, t) => s + t.amount, 0);
      return { month, income, expense, idx: i + 1, hasData: income > 0 || expense > 0, balance: income - expense };
    });
  }, [transactions]);

  // Calculate member payment status
  const memberStats = React.useMemo(() => {
    return members.map(m => {
      const paid = transactions.filter(t => t.type === 'income' && ((t.memberId === m.id) || (t.member_id === m.id))).reduce((s, t) => s + t.amount, 0);
      const due = (m.monthly_due || m.monthlyDue || 0) * 10;
      return {
        ...m,
        monthlyDue: m.monthly_due || m.monthlyDue || 0,
        totalPaid: paid,
        totalDue: due,
        status: paid >= due ? 'paid' : paid > 0 ? 'partial' : 'unpaid'
      };
    });
  }, [members, transactions]);

  const monthlyRows = monthlyChart;
  const totalIncome = monthlyRows.reduce((s, r) => s + r.income, 0);
  const totalExpense = monthlyRows.reduce((s, r) => s + r.expense, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Tab bar */}
      <div className="card" style={{ padding: '8px', display: 'flex', gap: 4 }}>
        {[['monthly', IC.chart(15), 'Theo tháng'], ['member', IC.users(15), 'Theo thành viên']].map(([id, icon, label]) => (
          <button key={id} onClick={() => setTab(id)}
            style={{ flex: 1, padding: '9px 14px', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 13, fontFamily: 'inherit', transition: 'all 0.15s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
              background: tab === id ? 'var(--primary)' : 'transparent',
              color: tab === id ? 'white' : 'var(--text-3)',
            }}>{icon}{label}
          </button>
        ))}
        <button onClick={() => exportPDF(transactions, categories, memberStats)}
          style={{ padding: '9px 16px', borderRadius: 8, border: '1px solid var(--border)', cursor: 'pointer', fontWeight: 600, fontSize: 13, fontFamily: 'inherit', transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: 7, background: 'transparent', color: 'var(--expense)', whiteSpace: 'nowrap' }}>
          {IC.download(15)} Xuất PDF
        </button>
      </div>

      {tab === 'monthly' && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
            {[
              { label: 'Tổng thu cả năm', v: totalIncome, c: 'var(--income)', bg: 'var(--income-light)', icon: 'trendUp' },
              { label: 'Tổng chi cả năm', v: totalExpense, c: 'var(--expense)', bg: 'var(--expense-light)', icon: 'trendDown' },
              { label: 'Số dư thuần', v: totalIncome - totalExpense, c: 'var(--primary)', bg: 'var(--primary-light)', icon: 'wallet' },
            ].map((s, i) => (
              <div key={i} className="stat-card" style={{ padding: '14px 18px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div className="stat-label">{s.label}</div>
                    <div style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 22, color: s.c, marginTop: 4 }}>{formatVND(s.v)}</div>
                  </div>
                  <div className="stat-icon" style={{ background: s.bg, color: s.c }}>{IC[s.icon](20)}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="card">
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
              <div className="section-title" style={{ marginBottom: 0 }}>Báo cáo thu chi theo tháng — {new Date().getFullYear()}</div>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Tháng</th>
                    <th style={{ textAlign: 'right' }}>Tổng thu</th>
                    <th style={{ textAlign: 'right' }}>Tổng chi</th>
                    <th style={{ textAlign: 'right' }}>Chênh lệch</th>
                    <th>Thanh toán</th>
                  </tr>
                </thead>
                <tbody>
                  {monthlyRows.map(r => (
                    <tr key={r.idx} style={{ opacity: r.hasData ? 1 : 0.4 }}>
                      <td style={{ fontWeight: 600 }}>Tháng {r.idx}</td>
                      <td style={{ textAlign: 'right', fontFamily: 'Space Grotesk', fontSize: 13, color: r.income > 0 ? 'var(--income)' : 'var(--text-4)' }}>{r.income > 0 ? formatVNDFull(r.income) : '—'}</td>
                      <td style={{ textAlign: 'right', fontFamily: 'Space Grotesk', fontSize: 13, color: r.expense > 0 ? 'var(--expense)' : 'var(--text-4)' }}>{r.expense > 0 ? formatVNDFull(r.expense) : '—'}</td>
                      <td style={{ textAlign: 'right', fontFamily: 'Space Grotesk', fontSize: 13, fontWeight: 700, color: r.balance >= 0 ? 'var(--income)' : 'var(--expense)' }}>
                        {r.hasData ? (r.balance >= 0 ? '+' : '') + formatVNDFull(r.balance) : '—'}
                      </td>
                      <td>
                        {r.hasData ? (
                          <div style={{ width: '100%', maxWidth: 120 }}>
                            <div className="progress-track">
                              <div className="progress-fill" style={{ width: Math.min((r.income / (r.income + r.expense || 1)) * 100, 100) + '%', background: 'var(--income)' }} />
                            </div>
                          </div>
                        ) : '—'}
                      </td>
                    </tr>
                  ))}
                  <tr style={{ fontWeight: 700, background: 'var(--surface-2)' }}>
                    <td>Tổng cộng</td>
                    <td style={{ textAlign: 'right', fontFamily: 'Space Grotesk', color: 'var(--income)' }}>{formatVNDFull(totalIncome)}</td>
                    <td style={{ textAlign: 'right', fontFamily: 'Space Grotesk', color: 'var(--expense)' }}>{formatVNDFull(totalExpense)}</td>
                    <td style={{ textAlign: 'right', fontFamily: 'Space Grotesk', color: totalIncome >= totalExpense ? 'var(--income)' : 'var(--expense)' }}>{formatVNDFull(totalIncome - totalExpense)}</td>
                    <td />
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {tab === 'member' && (
        <div className="card">
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
            <div className="section-title" style={{ marginBottom: 0 }}>Tình hình nộp quỹ thành viên — {new Date().getFullYear()}</div>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Thành viên</th>
                  <th style={{ textAlign: 'right' }}>Quỹ/tháng</th>
                  <th style={{ textAlign: 'right' }}>Phải nộp</th>
                  <th style={{ textAlign: 'right' }}>Đã nộp</th>
                  <th style={{ textAlign: 'right' }}>Còn lại</th>
                  <th>Tiến độ</th>
                  <th style={{ textAlign: 'center' }}>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {memberStats.map(m => {
                  const pct = Math.min((m.totalPaid / (m.totalDue || 1)) * 100, 100);
                  const rem = m.totalDue - m.totalPaid;
                  return (
                    <tr key={m.id}>
                      <td>
                        <div style={{ fontWeight: 500 }}>{m.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-4)' }}>{m.code}</div>
                      </td>
                      <td style={{ textAlign: 'right', fontSize: 13 }}>{formatVNDFull(m.monthlyDue)}</td>
                      <td style={{ textAlign: 'right', fontFamily: 'Space Grotesk', fontSize: 13 }}>{formatVNDFull(m.totalDue)}</td>
                      <td style={{ textAlign: 'right', fontFamily: 'Space Grotesk', fontSize: 13, color: 'var(--income)', fontWeight: 600 }}>{formatVNDFull(m.totalPaid)}</td>
                      <td style={{ textAlign: 'right', fontFamily: 'Space Grotesk', fontSize: 13, color: rem > 0 ? 'var(--expense)' : 'var(--income)', fontWeight: 600 }}>
                        {rem > 0 ? formatVNDFull(rem) : 'Đủ'}
                      </td>
                      <td style={{ minWidth: 120 }}>
                        <div className="progress-track">
                          <div className="progress-fill" style={{ width: pct + '%', background: pct >= 100 ? 'var(--income)' : pct > 50 ? 'var(--warning)' : 'var(--expense)' }} />
                        </div>
                        <div style={{ fontSize: 10, color: 'var(--text-4)', marginTop: 3 }}>{pct.toFixed(0)}%</div>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span className={'badge ' + (m.status === 'paid' ? 'badge-income' : m.status === 'partial' ? 'badge-warning' : 'badge-expense')}>
                          {m.status === 'paid' ? 'Đủ' : m.status === 'partial' ? 'Thiếu' : 'Chưa nộp'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}


export default Reports;
