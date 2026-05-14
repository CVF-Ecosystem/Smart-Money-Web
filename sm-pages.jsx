
const { useState, useEffect } = React;

// ── Members Page ─────────────────────────────────────────────────────────────
function Members() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ code: '', name: '', monthlyDue: '' });

  useEffect(() => {
    loadMembers();
  }, []);

  async function loadMembers() {
    try {
      setLoading(true);
      const data = await DataAdapter.getMembers();
      
      // Calculate payment status for each member
      const transactions = await DataAdapter.getTransactions({ type: 'income' });
      const enriched = data.map(m => {
        const paid = transactions.filter(t => t.memberId === m.id || t.member_id === m.id).reduce((s, t) => s + t.amount, 0);
        const due = (m.monthly_due || m.monthlyDue || 0) * 10; // Assuming 10 months
        return {
          ...m,
          monthlyDue: m.monthly_due || m.monthlyDue || 0,
          totalPaid: paid,
          totalDue: due,
          status: paid >= due ? 'paid' : paid > 0 ? 'partial' : 'unpaid'
        };
      });
      
      setMembers(enriched);
    } catch (error) {
      console.error('Failed to load members:', error);
      alert('Không thể tải danh sách thành viên');
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!form.code || !form.name) {
      alert('Vui lòng điền đầy đủ thông tin');
      return;
    }

    try {
      if (editing) {
        await DataAdapter.updateMember(editing.id, {
          code: form.code,
          name: form.name,
          monthly_due: Number(form.monthlyDue) || 0
        });
      } else {
        await DataAdapter.addMember({
          code: form.code,
          name: form.name,
          monthly_due: Number(form.monthlyDue) || 0
        });
      }
      
      setShowModal(false);
      setEditing(null);
      setForm({ code: '', name: '', monthlyDue: '' });
      loadMembers();
    } catch (error) {
      console.error('Failed to save member:', error);
      alert('Không thể lưu thành viên: ' + error.message);
    }
  }

  async function handleDelete(id) {
    if (!confirm('Xóa thành viên này?')) return;
    
    try {
      await DataAdapter.deleteMember(id);
      loadMembers();
    } catch (error) {
      console.error('Failed to delete member:', error);
      alert('Không thể xóa thành viên: ' + error.message);
    }
  }

  function handleEdit(member) {
    setEditing(member);
    setForm({
      code: member.code,
      name: member.name,
      monthlyDue: member.monthlyDue || member.monthly_due || ''
    });
    setShowModal(true);
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
        <div style={{ textAlign: 'center', color: 'var(--text-3)' }}>
          <div style={{ fontSize: 14, marginBottom: 8 }}>Đang tải danh sách thành viên...</div>
        </div>
      </div>
    );
  }

  const filtered = members.filter(m =>
    !search || m.name.toLowerCase().includes(search.toLowerCase()) || m.code.toLowerCase().includes(search.toLowerCase())
  );

  const fullyPaid = members.filter(m => m.status === 'paid').length;
  const partial = members.filter(m => m.status === 'partial').length;
  const unpaid = members.filter(m => m.status === 'unpaid').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
        {[
          { label: 'Tổng thành viên', value: members.length, color: 'var(--primary)', bg: 'var(--primary-light)', icon: 'users' },
          { label: 'Đã nộp đủ', value: fullyPaid, color: 'var(--income)', bg: 'var(--income-light)', icon: 'checkCircle' },
          { label: 'Nộp thiếu', value: partial, color: 'var(--warning)', bg: 'var(--warning-light)', icon: 'alert' },
          { label: 'Chưa nộp', value: unpaid, color: 'var(--expense)', bg: 'var(--expense-light)', icon: 'x' },
        ].map((s, i) => (
          <div key={i} className="stat-card" style={{ padding: '14px 18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div className="stat-label">{s.label}</div>
                <div style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 28, color: s.color, marginTop: 4 }}>{s.value}</div>
              </div>
              <div className="stat-icon" style={{ background: s.bg, color: s.color }}>{IC[s.icon](20)}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filter + Add */}
      <div className="card" style={{ padding: '14px 16px' }}>
        <div className="filter-row">
          <div className="search-wrap" style={{ flex: 1 }}>
            {IC.search(15)}
            <input className="input" style={{ paddingLeft: 34, height: 38, fontSize: 13 }}
              placeholder="Tìm kiếm thành viên..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <button className="btn btn-primary btn-sm" onClick={() => setShowModal(true)}>
            {IC.plus(15)} Thêm thành viên
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Mã NV</th>
                <th>Họ tên</th>
                <th style={{ textAlign: 'right' }}>Quỹ/tháng</th>
                <th style={{ textAlign: 'right' }}>Tổng phải nộp</th>
                <th style={{ textAlign: 'right' }}>Đã nộp</th>
                <th style={{ textAlign: 'right' }}>Còn lại</th>
                <th style={{ textAlign: 'center' }}>Trạng thái</th>
                <th style={{ textAlign: 'center' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(m => {
                const remaining = m.totalDue - m.totalPaid;
                const statusMap = { paid: ['badge-income', 'Đủ'], partial: ['badge-warning', 'Thiếu'], unpaid: ['badge-expense', 'Chưa nộp'] };
                const [cls, label] = statusMap[m.status] || ['badge-neutral', '?'];
                return (
                  <tr key={m.id}>
                    <td><span style={{ fontFamily: 'Space Grotesk', fontSize: 12, background: 'var(--surface-3)', padding: '2px 8px', borderRadius: 4, fontWeight: 600 }}>{m.code}</span></td>
                    <td style={{ fontWeight: 500 }}>{m.name}</td>
                    <td style={{ textAlign: 'right', fontFamily: 'Space Grotesk', fontSize: 13 }}>{formatVNDFull(m.monthlyDue)}</td>
                    <td style={{ textAlign: 'right', fontFamily: 'Space Grotesk', fontSize: 13 }}>{formatVNDFull(m.totalDue)}</td>
                    <td style={{ textAlign: 'right', fontFamily: 'Space Grotesk', fontSize: 13, color: 'var(--income)', fontWeight: 600 }}>{formatVNDFull(m.totalPaid)}</td>
                    <td style={{ textAlign: 'right', fontFamily: 'Space Grotesk', fontSize: 13, color: remaining > 0 ? 'var(--expense)' : 'var(--income)', fontWeight: 600 }}>
                      {remaining > 0 ? '−' : ''}{formatVNDFull(Math.abs(remaining))}
                    </td>
                    <td style={{ textAlign: 'center' }}><span className={'badge ' + cls}>{label}</span></td>
                    <td>
                      <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                        <button className="icon-btn" style={{ width: 30, height: 30, color: 'var(--primary)' }} onClick={() => handleEdit(m)}>{IC.edit(14)}</button>
                        <button className="icon-btn" style={{ width: 30, height: 30, color: 'var(--expense)' }} onClick={() => handleDelete(m.id)}>{IC.trash(14)}</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Modal */}
      {showModal && (
        <div className="modal-bg" onClick={() => { setShowModal(false); setEditing(null); setForm({ code: '', name: '', monthlyDue: '' }); }}>
          <div className="modal-box" style={{ maxWidth: 420 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">{editing ? 'Sửa thành viên' : 'Thêm thành viên'}</div>
              <button className="icon-btn" style={{ border: 'none' }} onClick={() => { setShowModal(false); setEditing(null); }}>{IC.x(16)}</button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="input-group"><label className="input-label">Mã nhân viên *</label>
                <input className="input" value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} placeholder="VD: NV011" /></div>
              <div className="input-group"><label className="input-label">Họ tên *</label>
                <input className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Nguyễn Văn A" /></div>
              <div className="input-group"><label className="input-label">Đóng quỹ hàng tháng (VND)</label>
                <input className="input" type="number" value={form.monthlyDue} onChange={e => setForm(f => ({ ...f, monthlyDue: e.target.value }))} placeholder="150000" /></div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost btn-sm" onClick={() => { setShowModal(false); setEditing(null); }}>Hủy</button>
              <button className="btn btn-primary btn-sm" onClick={handleSave}>{IC.plus(15)} {editing ? 'Lưu' : 'Thêm'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

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

// ── Categories Page ───────────────────────────────────────────────────────────
function Categories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ type: 'expense', code: '', name: '', color: '#3B82F6' });

  useEffect(() => {
    loadCategories();
  }, []);

  async function loadCategories() {
    try {
      setLoading(true);
      const data = await DataAdapter.getCategories();
      setCategories(data);
    } catch (error) {
      console.error('Failed to load categories:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!form.code || !form.name) {
      alert('Vui lòng điền đầy đủ thông tin');
      return;
    }

    try {
      if (editing) {
        await DataAdapter.updateCategory(editing.id, {
          code: form.code,
          name: form.name,
          type: form.type,
          color: form.color
        });
      } else {
        await DataAdapter.addCategory({
          code: form.code,
          name: form.name,
          type: form.type,
          color: form.color
        });
      }
      
      setShowModal(false);
      setEditing(null);
      setForm({ type: 'expense', code: '', name: '', color: '#3B82F6' });
      loadCategories();
    } catch (error) {
      console.error('Failed to save category:', error);
      alert('Không thể lưu danh mục: ' + error.message);
    }
  }

  async function handleDelete(id) {
    if (!confirm('Xóa danh mục này?')) return;
    
    try {
      await DataAdapter.deleteCategory(id);
      loadCategories();
    } catch (error) {
      console.error('Failed to delete category:', error);
      alert('Không thể xóa danh mục: ' + error.message);
    }
  }

  function handleEdit(cat) {
    setEditing(cat);
    setForm({
      type: cat.type,
      code: cat.code,
      name: cat.name,
      color: cat.color || '#3B82F6'
    });
    setShowModal(true);
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
        <div style={{ textAlign: 'center', color: 'var(--text-3)' }}>
          <div style={{ fontSize: 14 }}>Đang tải danh mục...</div>
        </div>
      </div>
    );
  }

  const income = categories.filter(c => c.type === 'income');
  const expense = categories.filter(c => c.type === 'expense');

  function CatTable({ cats, type }) {
    return (
      <div className="card">
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: type === 'income' ? 'var(--income)' : 'var(--expense)', display: 'inline-block' }} />
          <div style={{ fontWeight: 700, fontSize: 14 }}>{type === 'income' ? 'Nguồn thu' : 'Hạng mục chi'}</div>
          <span className={'badge ' + (type === 'income' ? 'badge-income' : 'badge-expense')} style={{ marginLeft: 'auto' }}>{cats.length} danh mục</span>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Mã</th><th>Tên danh mục</th><th style={{ textAlign: 'center' }}>Thao tác</th></tr>
            </thead>
            <tbody>
              {cats.map(c => (
                <tr key={c.id}>
                  <td>
                    <span style={{ fontFamily: 'Space Grotesk', fontSize: 12, background: c.color + '18', color: c.color, padding: '3px 9px', borderRadius: 5, fontWeight: 700 }}>{c.code}</span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 500 }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: c.color, flexShrink: 0 }} />
                      {c.name}
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                      <button className="icon-btn" style={{ width: 30, height: 30, color: 'var(--primary)' }} onClick={() => handleEdit(c)}>{IC.edit(14)}</button>
                      <button className="icon-btn" style={{ width: 30, height: 30, color: 'var(--expense)' }} onClick={() => handleDelete(c.id)}>{IC.trash(14)}</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button className="btn btn-primary btn-sm" onClick={() => setShowModal(true)}>{IC.plus(15)} Thêm danh mục</button>
      </div>
      <CatTable cats={income} type="income" />
      <CatTable cats={expense} type="expense" />

      {showModal && (
        <div className="modal-bg" onClick={() => { setShowModal(false); setEditing(null); setForm({ type: 'expense', code: '', name: '', color: '#3B82F6' }); }}>
          <div className="modal-box" style={{ maxWidth: 420 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">{editing ? 'Sửa danh mục' : 'Thêm danh mục'}</div>
              <button className="icon-btn" style={{ border: 'none' }} onClick={() => { setShowModal(false); setEditing(null); }}>{IC.x(16)}</button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {['income', 'expense'].map(t => (
                  <button key={t} onClick={() => setForm(f => ({ ...f, type: t }))}
                    style={{ padding: '10px', borderRadius: 8, border: '2px solid', cursor: 'pointer', fontWeight: 600, fontSize: 13, fontFamily: 'inherit', background: 'transparent',
                      borderColor: form.type === t ? 'var(--primary)' : 'var(--border)',
                      color: form.type === t ? 'var(--primary)' : 'var(--text-3)' }}>
                    {t === 'income' ? '📈 Thu' : '📉 Chi'}
                  </button>
                ))}
              </div>
              <div className="input-group"><label className="input-label">Mã danh mục *</label>
                <input className="input" placeholder="VD: T04, C07" value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} /></div>
              <div className="input-group"><label className="input-label">Tên danh mục *</label>
                <input className="input" placeholder="Tên danh mục..." value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
              <div className="input-group"><label className="input-label">Màu sắc</label>
                <input className="input" type="color" value={form.color} onChange={e => setForm(f => ({ ...f, color: e.target.value }))} /></div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost btn-sm" onClick={() => { setShowModal(false); setEditing(null); }}>Hủy</button>
              <button className="btn btn-primary btn-sm" onClick={handleSave}>{IC.plus(15)} {editing ? 'Lưu' : 'Thêm'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Budgets Page ──────────────────────────────────────────────────────────────
function Budgets() {
  const [budgets, setBudgets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ categoryId: '', amount: '', month: new Date().toISOString().slice(0, 7) });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const [budgetData, catData, txData] = await Promise.all([
        DataAdapter.getBudgets(),
        DataAdapter.getCategories(),
        DataAdapter.getTransactions({ type: 'expense' })
      ]);
      
      // Calculate spent for each budget
      const enriched = budgetData.map(b => {
        const spent = txData
          .filter(t => (t.categoryId === b.category_id || t.categoryId === b.categoryId) && t.date.startsWith(b.month || new Date().toISOString().slice(0, 7)))
          .reduce((s, t) => s + t.amount, 0);
        return { ...b, spent, categoryId: b.category_id || b.categoryId };
      });
      
      setBudgets(enriched);
      setCategories(catData);
    } catch (error) {
      console.error('Failed to load budgets:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!form.categoryId || !form.amount) {
      alert('Vui lòng điền đầy đủ thông tin');
      return;
    }

    try {
      const budgetData = {
        category_id: form.categoryId,
        amount: Number(form.amount),
        month: form.month
      };

      if (editing) {
        await DataAdapter.updateBudget(editing.id, budgetData);
      } else {
        await DataAdapter.addBudget(budgetData);
      }
      
      setShowModal(false);
      setEditing(null);
      setForm({ categoryId: '', amount: '', month: new Date().toISOString().slice(0, 7) });
      loadData();
    } catch (error) {
      console.error('Failed to save budget:', error);
      alert('Không thể lưu ngân sách: ' + error.message);
    }
  }

  async function handleDelete(id) {
    if (!confirm('Xóa ngân sách này?')) return;
    
    try {
      await DataAdapter.deleteBudget(id);
      loadData();
    } catch (error) {
      console.error('Failed to delete budget:', error);
      alert('Không thể xóa ngân sách: ' + error.message);
    }
  }

  function handleEdit(budget) {
    setEditing(budget);
    setForm({
      categoryId: budget.categoryId || budget.category_id,
      amount: budget.amount.toString(),
      month: budget.month || new Date().toISOString().slice(0, 7)
    });
    setShowModal(true);
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
        <div style={{ textAlign: 'center', color: 'var(--text-3)' }}>
          <div style={{ fontSize: 14 }}>Đang tải ngân sách...</div>
        </div>
      </div>
    );
  }

  const expCats = categories.filter(c => c.type === 'expense');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 14, color: 'var(--text-3)' }}>Ngân sách tháng {new Date().getMonth() + 1} / {new Date().getFullYear()}</div>
        <button className="btn btn-primary btn-sm" onClick={() => setShowModal(true)}>{IC.plus(15)} Đặt ngân sách</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        {budgets.map(b => {
          const cat = expCats.find(c => c.id === b.categoryId);
          if (!cat) return null;
          const pct = Math.min((b.spent / b.amount) * 100, 100);
          const over = b.spent > b.amount;
          return (
            <div key={b.id} className="card" style={{ padding: '18px 20px', position: 'relative' }}>
              <div style={{ position: 'absolute', top: 12, right: 12, display: 'flex', gap: 4 }}>
                <button className="icon-btn" style={{ width: 26, height: 26, color: 'var(--primary)' }} onClick={() => handleEdit(b)}>{IC.edit(13)}</button>
                <button className="icon-btn" style={{ width: 26, height: 26, color: 'var(--expense)' }} onClick={() => handleDelete(b.id)}>{IC.trash(13)}</button>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14, paddingRight: 60 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 4 }}>
                    <span style={{ width: 9, height: 9, borderRadius: '50%', background: cat.color }} />
                    <span style={{ fontWeight: 600, fontSize: 14 }}>{cat.name}</span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-3)' }}>{cat.code}</div>
                </div>
                {over && <span className="badge badge-expense">{IC.alert(11)} Vượt NS</span>}
              </div>
              <div className="progress-track" style={{ height: 8, marginBottom: 10 }}>
                <div className="progress-fill" style={{ width: pct + '%', background: over ? 'var(--expense)' : pct > 80 ? 'var(--warning)' : 'var(--income)' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                <div>
                  <span style={{ color: 'var(--text-3)' }}>Đã chi: </span>
                  <span style={{ fontFamily: 'Space Grotesk', fontWeight: 700, color: over ? 'var(--expense)' : 'var(--text)' }}>{formatVND(b.spent)}</span>
                </div>
                <div>
                  <span style={{ color: 'var(--text-3)' }}>Ngân sách: </span>
                  <span style={{ fontFamily: 'Space Grotesk', fontWeight: 600 }}>{formatVND(b.amount)}</span>
                </div>
              </div>
              {over && (
                <div style={{ marginTop: 8, fontSize: 12, color: 'var(--expense)', fontWeight: 600 }}>
                  Vượt {formatVND(b.spent - b.amount)}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {showModal && (
        <div className="modal-bg" onClick={() => { setShowModal(false); setEditing(null); setForm({ categoryId: '', amount: '', month: new Date().toISOString().slice(0, 7) }); }}>
          <div className="modal-box" style={{ maxWidth: 420 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">{editing ? 'Sửa ngân sách' : 'Đặt ngân sách'}</div>
              <button className="icon-btn" style={{ border: 'none' }} onClick={() => { setShowModal(false); setEditing(null); }}>{IC.x(16)}</button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="input-group"><label className="input-label">Danh mục chi *</label>
                <select className="input" value={form.categoryId} onChange={e => setForm(f => ({ ...f, categoryId: e.target.value }))}>
                  <option value="">-- Chọn danh mục --</option>
                  {expCats.map(c => <option key={c.id} value={c.id}>{c.code} - {c.name}</option>)}
                </select>
              </div>
              <div className="input-group"><label className="input-label">Ngân sách (VND) *</label>
                <input className="input" type="number" placeholder="5000000" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} /></div>
              <div className="input-group"><label className="input-label">Tháng</label>
                <input className="input" type="month" value={form.month} onChange={e => setForm(f => ({ ...f, month: e.target.value }))} /></div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost btn-sm" onClick={() => { setShowModal(false); setEditing(null); }}>Hủy</button>
              <button className="btn btn-primary btn-sm" onClick={handleSave}>{IC.plus(15)} {editing ? 'Lưu' : 'Thêm'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Recurring Page ────────────────────────────────────────────────────────────
function Recurring() {
  const [recurring, setRecurring] = useState([]);
  const [categories, setCategories] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', type: 'expense', categoryId: '', amount: '', frequency: 'monthly', dayOfMonth: '1', isActive: true });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const [recData, catData, memData] = await Promise.all([
        DataAdapter.getRecurringTransactions(),
        DataAdapter.getCategories(),
        DataAdapter.getMembers()
      ]);
      setRecurring(recData);
      setCategories(catData);
      setMembers(memData);
    } catch (error) {
      console.error('Failed to load recurring:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!form.name || !form.categoryId || !form.amount) {
      alert('Vui lòng điền đầy đủ thông tin');
      return;
    }

    try {
      const recData = {
        name: form.name,
        type: form.type,
        category_id: form.categoryId,
        amount: Number(form.amount),
        frequency: form.frequency,
        day_of_month: Number(form.dayOfMonth),
        is_active: form.isActive
      };

      if (editing) {
        await DataAdapter.updateRecurringTransaction(editing.id, recData);
      } else {
        await DataAdapter.addRecurringTransaction(recData);
      }
      
      setShowModal(false);
      setEditing(null);
      setForm({ name: '', type: 'expense', categoryId: '', amount: '', frequency: 'monthly', dayOfMonth: '1', isActive: true });
      loadData();
    } catch (error) {
      console.error('Failed to save recurring:', error);
      alert('Không thể lưu giao dịch định kỳ: ' + error.message);
    }
  }

  async function handleDelete(id) {
    if (!confirm('Xóa giao dịch định kỳ này?')) return;
    
    try {
      await DataAdapter.deleteRecurringTransaction(id);
      loadData();
    } catch (error) {
      console.error('Failed to delete recurring:', error);
      alert('Không thể xóa giao dịch định kỳ: ' + error.message);
    }
  }

  async function handleToggleActive(id, isActive) {
    try {
      await DataAdapter.updateRecurringTransaction(id, { is_active: !isActive });
      loadData();
    } catch (error) {
      console.error('Failed to toggle recurring:', error);
      alert('Không thể cập nhật trạng thái: ' + error.message);
    }
  }

  function handleEdit(rec) {
    setEditing(rec);
    setForm({
      name: rec.name,
      type: rec.type,
      categoryId: rec.category_id || rec.categoryId,
      amount: rec.amount.toString(),
      frequency: rec.frequency,
      dayOfMonth: (rec.day_of_month || rec.dayOfMonth || 1).toString(),
      isActive: rec.is_active !== undefined ? rec.is_active : rec.isActive
    });
    setShowModal(true);
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
        <div style={{ textAlign: 'center', color: 'var(--text-3)' }}>
          <div style={{ fontSize: 14 }}>Đang tải giao dịch định kỳ...</div>
        </div>
      </div>
    );
  }

  const freqMap = { monthly: 'Hàng tháng', quarterly: 'Hàng quý', yearly: 'Hàng năm' };
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button className="btn btn-primary btn-sm" onClick={() => setShowModal(true)}>{IC.plus(15)} Thêm định kỳ</button>
      </div>
      <div className="card">
        <div className="table-wrap">
          <table>
            <thead><tr><th>Tên</th><th>Tần suất</th><th>Ngày trong tháng</th><th>Loại</th><th style={{ textAlign: 'right' }}>Số tiền</th><th>Lần tiếp theo</th><th style={{ textAlign: 'center' }}>Trạng thái</th><th style={{ textAlign: 'center' }}>Thao tác</th></tr></thead>
            <tbody>
              {recurring.map(r => {
                const cat = getCatById(r.category_id || r.categoryId);
                const isActive = r.is_active !== undefined ? r.is_active : r.isActive;
                return (
                  <tr key={r.id}>
                    <td style={{ fontWeight: 500 }}>{r.name}</td>
                    <td style={{ fontSize: 13 }}>{freqMap[r.frequency]}</td>
                    <td style={{ textAlign: 'center', fontSize: 13 }}>Ngày {r.day_of_month || r.dayOfMonth}</td>
                    <td><span className={'badge ' + (r.type === 'income' ? 'badge-income' : 'badge-expense')}>{r.type === 'income' ? 'Thu' : 'Chi'}</span></td>
                    <td style={{ textAlign: 'right', fontFamily: 'Space Grotesk', fontWeight: 600, color: r.type === 'income' ? 'var(--income)' : 'var(--expense)' }}>{formatVNDFull(r.amount)}</td>
                    <td style={{ fontSize: 13 }}>{formatDate(r.next_run_date || r.nextRunDate || new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toISOString().split('T')[0])}</td>
                    <td style={{ textAlign: 'center' }}>
                      <button onClick={() => handleToggleActive(r.id, isActive)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 0 }}>
                        <span className={'badge ' + (isActive ? 'badge-income' : 'badge-neutral')}>{isActive ? 'Đang chạy' : 'Tạm dừng'}</span>
                      </button>
                    </td>
                    <td><div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                      <button className="icon-btn" style={{ width: 30, height: 30, color: 'var(--primary)' }} onClick={() => handleEdit(r)}>{IC.edit(14)}</button>
                      <button className="icon-btn" style={{ width: 30, height: 30, color: 'var(--expense)' }} onClick={() => handleDelete(r.id)}>{IC.trash(14)}</button>
                    </div></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal-bg" onClick={() => { setShowModal(false); setEditing(null); setForm({ name: '', type: 'expense', categoryId: '', amount: '', frequency: 'monthly', dayOfMonth: '1', isActive: true }); }}>
          <div className="modal-box" style={{ maxWidth: 480 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">{editing ? 'Sửa giao dịch định kỳ' : 'Thêm giao dịch định kỳ'}</div>
              <button className="icon-btn" style={{ border: 'none' }} onClick={() => { setShowModal(false); setEditing(null); }}>{IC.x(16)}</button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="input-group"><label className="input-label">Tên giao dịch *</label>
                <input className="input" placeholder="VD: Đóng quỹ hàng tháng" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {['income', 'expense'].map(t => (
                  <button key={t} onClick={() => setForm(f => ({ ...f, type: t }))}
                    style={{ padding: '10px', borderRadius: 8, border: '2px solid', cursor: 'pointer', fontWeight: 600, fontSize: 13, fontFamily: 'inherit', background: 'transparent',
                      borderColor: form.type === t ? 'var(--primary)' : 'var(--border)',
                      color: form.type === t ? 'var(--primary)' : 'var(--text-3)' }}>
                    {t === 'income' ? '📈 Thu' : '📉 Chi'}
                  </button>
                ))}
              </div>
              <div className="input-group"><label className="input-label">Danh mục *</label>
                <select className="input" value={form.categoryId} onChange={e => setForm(f => ({ ...f, categoryId: e.target.value }))}>
                  <option value="">-- Chọn danh mục --</option>
                  {categories.filter(c => c.type === form.type).map(c => <option key={c.id} value={c.id}>{c.code} - {c.name}</option>)}
                </select>
              </div>
              <div className="input-group"><label className="input-label">Số tiền (VND) *</label>
                <input className="input" type="number" placeholder="150000" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 8 }}>
                <div className="input-group"><label className="input-label">Tần suất</label>
                  <select className="input" value={form.frequency} onChange={e => setForm(f => ({ ...f, frequency: e.target.value }))}>
                    <option value="monthly">Hàng tháng</option>
                    <option value="quarterly">Hàng quý</option>
                    <option value="yearly">Hàng năm</option>
                  </select>
                </div>
                <div className="input-group"><label className="input-label">Ngày</label>
                  <input className="input" type="number" min="1" max="31" value={form.dayOfMonth} onChange={e => setForm(f => ({ ...f, dayOfMonth: e.target.value }))} /></div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input type="checkbox" checked={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} />
                <label style={{ fontSize: 13, color: 'var(--text-2)' }}>Kích hoạt ngay</label>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost btn-sm" onClick={() => { setShowModal(false); setEditing(null); }}>Hủy</button>
              <button className="btn btn-primary btn-sm" onClick={handleSave}>{IC.plus(15)} {editing ? 'Lưu' : 'Thêm'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Funds Page ────────────────────────────────────────────────────────────────
function Funds() {
  const [fundAccounts, setFundAccounts] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const [funds, txData] = await Promise.all([
        DataAdapter.getFundAccounts(),
        DataAdapter.getTransactions()
      ]);
      
      // Calculate stats for each fund
      const enriched = funds.map(fund => {
        const fundTxs = txData.filter(t => (t.fund_account_id || t.fundAccountId) === fund.id);
        const income = fundTxs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
        const expense = fundTxs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
        const initialBalance = fund.initial_balance || fund.initialBalance || 0;
        const balance = initialBalance + income - expense;
        
        return {
          ...fund,
          name: fund.name || 'Quỹ chính',
          totalIncome: income,
          totalExpense: expense,
          balance,
          openingBalance: initialBalance
        };
      });
      
      setFundAccounts(enriched);
      if (enriched.length > 0) {
        setStats(enriched[0]); // Use first fund as main
      }
    } catch (error) {
      console.error('Failed to load funds:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
        <div style={{ textAlign: 'center', color: 'var(--text-3)' }}>
          <div style={{ fontSize: 14 }}>Đang tải quỹ...</div>
        </div>
      </div>
    );
  }

  const mainFund = fundAccounts[0] || { name: 'Quỹ chính', balance: 0, openingBalance: 0, totalIncome: 0, totalExpense: 0 };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button className="btn btn-primary btn-sm">{IC.plus(15)} Thêm quỹ</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>{IC.wallet(22)}</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 16 }}>{mainFund.name}</div>
              <div style={{ fontSize: 12, color: 'var(--text-3)' }}>Quỹ chính · Tiền mặt</div>
            </div>
          </div>
          <div style={{ fontFamily: 'Space Grotesk', fontSize: 32, fontWeight: 700, color: 'var(--primary)', marginBottom: 16 }}>{formatVNDFull(mainFund.balance)}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[['Số dư đầu kỳ', mainFund.openingBalance, 'var(--text-2)'], ['Tổng thu vào', mainFund.totalIncome, 'var(--income)'], ['Tổng chi ra', mainFund.totalExpense, 'var(--expense)']].map(([l, v, c]) => (
              <div key={l} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span style={{ color: 'var(--text-3)' }}>{l}</span>
                <span style={{ fontFamily: 'Space Grotesk', fontWeight: 600, color: c }}>{formatVNDFull(v)}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="card" style={{ padding: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px dashed var(--border)', background: 'transparent', cursor: 'pointer' }}>
          <div style={{ textAlign: 'center', color: 'var(--text-4)' }}>
            {IC.plus(32)}
            <div style={{ marginTop: 10, fontWeight: 500 }}>Thêm quỹ mới</div>
            <div style={{ fontSize: 12, marginTop: 4 }}>Quản lý nhiều nguồn quỹ</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Import/Export Page ────────────────────────────────────────────────────────
function ImportExport() {
  const [importing, setImporting] = React.useState(false);
  const [exporting, setExporting] = React.useState(false);
  const [backing, setBacking] = React.useState(false);
  const fileInputRef = React.useRef(null);
  const restoreInputRef = React.useRef(null);

  async function handleImport(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    try {
      setImporting(true);
      const result = await ImportExportService.importFromExcel(file);
      alert(`✅ Import thành công!\n\nĐã import: ${result.success} giao dịch\nLỗi: ${result.errors.length}\n\n${result.errors.length > 0 ? 'Chi tiết lỗi:\n' + result.errors.slice(0, 3).join('\n') : ''}`);
      window.location.reload(); // Reload to show new data
    } catch (error) {
      console.error('Import failed:', error);
      alert('❌ Import thất bại: ' + error.message);
    } finally {
      setImporting(false);
      e.target.value = ''; // Reset input
    }
  }

  async function handleExport() {
    try {
      setExporting(true);
      await ImportExportService.exportToExcel();
      alert('✅ Export thành công! File đã được tải xuống.');
    } catch (error) {
      console.error('Export failed:', error);
      alert('❌ Export thất bại: ' + error.message);
    } finally {
      setExporting(false);
    }
  }

  async function handleBackup() {
    try {
      setBacking(true);
      await ImportExportService.backupToJSON();
      alert('✅ Backup thành công! File JSON đã được tải xuống.');
    } catch (error) {
      console.error('Backup failed:', error);
      alert('❌ Backup thất bại: ' + error.message);
    } finally {
      setBacking(false);
    }
  }

  async function handleRestore(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    try {
      const result = await ImportExportService.restoreFromJSON(file);
      if (result.success) {
        alert('✅ Restore thành công!');
        window.location.reload();
      }
    } catch (error) {
      console.error('Restore failed:', error);
      alert('❌ Restore thất bại: ' + error.message);
    } finally {
      e.target.value = '';
    }
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
      {/* Import Excel */}
      <div className="card" style={{ padding: '24px' }}>
        <div style={{ width: 48, height: 48, borderRadius: 12, background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', marginBottom: 14 }}>
          {IC.upload(22)}
        </div>
        <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6 }}>Import từ Excel</div>
        <div style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 18 }}>Đọc dữ liệu từ file .xlsx / .xls</div>
        <input ref={fileInputRef} type="file" accept=".xlsx,.xls" onChange={handleImport} style={{ display: 'none' }} />
        <button className="btn btn-ghost btn-sm" style={{ borderColor: 'var(--primary)', color: 'var(--primary)' }} 
          onClick={() => fileInputRef.current?.click()} disabled={importing}>
          {importing ? 'Đang import...' : 'Chọn file Excel'}
        </button>
      </div>

      {/* Export Excel */}
      <div className="card" style={{ padding: '24px' }}>
        <div style={{ width: 48, height: 48, borderRadius: 12, background: 'var(--income-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--income)', marginBottom: 14 }}>
          {IC.download(22)}
        </div>
        <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6 }}>Export ra Excel</div>
        <div style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 18 }}>Xuất toàn bộ giao dịch ra file .xlsx</div>
        <button className="btn btn-ghost btn-sm" style={{ borderColor: 'var(--income)', color: 'var(--income)' }} 
          onClick={handleExport} disabled={exporting}>
          {exporting ? 'Đang export...' : 'Tải xuống Excel'}
        </button>
      </div>

      {/* Backup */}
      <div className="card" style={{ padding: '24px' }}>
        <div style={{ width: 48, height: 48, borderRadius: 12, background: 'var(--warning-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--warning)', marginBottom: 14 }}>
          {IC.refresh(22)}
        </div>
        <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6 }}>Sao lưu dữ liệu</div>
        <div style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 18 }}>Lưu toàn bộ dữ liệu về thiết bị (JSON)</div>
        <button className="btn btn-ghost btn-sm" style={{ borderColor: 'var(--warning)', color: 'var(--warning)' }} 
          onClick={handleBackup} disabled={backing}>
          {backing ? 'Đang backup...' : 'Backup ngay'}
        </button>
      </div>

      {/* Restore */}
      <div className="card" style={{ padding: '24px' }}>
        <div style={{ width: 48, height: 48, borderRadius: 12, background: 'var(--expense-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--expense)', marginBottom: 14 }}>
          {IC.upload(22)}
        </div>
        <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6 }}>Khôi phục dữ liệu</div>
        <div style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 18 }}>Khôi phục từ file backup JSON</div>
        <input ref={restoreInputRef} type="file" accept=".json" onChange={handleRestore} style={{ display: 'none' }} />
        <button className="btn btn-ghost btn-sm" style={{ borderColor: 'var(--expense)', color: 'var(--expense)' }} 
          onClick={() => restoreInputRef.current?.click()}>
          Chọn file JSON
        </button>
      </div>
    </div>
  );
}

// ── Settings Page ─────────────────────────────────────────────────────────────
function Settings() {
  const { theme, setTheme, lang, setLang } = useApp();
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
          <div className="user-avatar" style={{ width: 44, height: 44, fontSize: 16 }}>{(MOCK_DATA.user||{}).initials}</div>
          <div>
            <div style={{ fontWeight: 600 }}>{(MOCK_DATA.user||{}).name}</div>
            <div style={{ fontSize: 13, color: 'var(--text-3)' }}>{(MOCK_DATA.user||{}).email}</div>
          </div>
          <span className="badge badge-income" style={{ marginLeft: 'auto' }}>{(MOCK_DATA.user||{}).role}</span>
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

Object.assign(window, { Members, Reports, Categories, Budgets, Recurring, Funds, ImportExport, Settings });
