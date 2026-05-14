

import React, {  useState, useMemo, useEffect  } from 'react';

// ── Transaction Detail Modal ──────────────────────────────────────────────────
function TxDetailModal({ tx, onClose, onEdit }) {
  const cat = getCatById(tx.categoryId);
  const mem = getMemberById(tx.memberId);
  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal-box" style={{ maxWidth: 460 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: tx.type === 'income' ? 'var(--income-light)' : 'var(--expense-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: tx.type === 'income' ? 'var(--income)' : 'var(--expense)' }}>
              {tx.type === 'income' ? IC.arrowUp(18) : IC.arrowDown(18)}
            </div>
            <div>
              <div className="modal-title">{tx.recipientName || 'Chi tiết giao dịch'}</div>
              <div style={{ fontSize: 11.5, color: 'var(--text-4)', marginTop: 1 }}>{tx.id} · {formatDate(tx.date)}</div>
            </div>
          </div>
          <button className="icon-btn" style={{ border: 'none' }} onClick={onClose}>{IC.x(16)}</button>
        </div>
        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {/* Amount hero */}
          <div style={{ textAlign: 'center', padding: '20px 0 18px' }}>
            <div style={{ fontFamily: 'Space Grotesk', fontSize: 38, fontWeight: 800, letterSpacing: '-1.5px', color: tx.type === 'income' ? 'var(--income)' : 'var(--expense)' }}>
              {tx.type === 'income' ? '+' : '−'}{formatVNDFull(tx.amount)}
            </div>
            <span className={'badge ' + (tx.type === 'income' ? 'badge-income' : 'badge-expense')} style={{ marginTop: 8 }}>
              {tx.type === 'income' ? IC.arrowUp(11) : IC.arrowDown(11)} {tx.type === 'income' ? 'Thu vào' : 'Chi ra'}
            </span>
          </div>

          {/* Detail grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0, borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', padding: '16px 0' }}>
            {[
              ['Danh mục', cat ? <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: cat.color }} />{cat.code} · {cat.name}</span> : '—'],
              ['Thành viên', mem?.name || '—'],
              ['Ngày giao dịch', formatDate(tx.date)],
              ['Người nhận', tx.recipientName || '—'],
            ].map(([lbl, val]) => (
              <div key={lbl} style={{ padding: '8px 0' }}>
                <div style={{ fontSize: 11, color: 'var(--text-4)', marginBottom: 3 }}>{lbl}</div>
                <div style={{ fontSize: 13, color: 'var(--text-2)', fontWeight: 500 }}>{val}</div>
              </div>
            ))}
          </div>

          {/* Note */}
          {tx.note && (
            <div style={{ marginTop: 14, padding: '12px 14px', background: 'var(--surface-2)', borderRadius: 8 }}>
              <div style={{ fontSize: 11, color: 'var(--text-4)', marginBottom: 4 }}>Ghi chú</div>
              <div style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.6 }}>{tx.note}</div>
            </div>
          )}

          {/* Attachment */}
          <div style={{ marginTop: 12, padding: '11px 14px', border: '1.5px dashed var(--border)', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 10, color: 'var(--text-4)' }}>
            {IC.paperclip(15)}
            <span style={{ fontSize: 13 }}>Không có chứng từ đính kèm</span>
            <label style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 5, cursor: 'pointer' }} className="btn btn-ghost btn-xs">
              {IC.upload(12)} Đính kèm
              <input type="file" style={{ display: 'none' }} accept="image/*,.pdf" />
            </label>
          </div>

          {/* OCR hint */}
          <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-4)', padding: '0 2px' }}>
            {IC.zap(13)}
            <span>Chụp hóa đơn để OCR tự điền số tiền</span>
            <button className="btn btn-ghost btn-xs" style={{ marginLeft: 'auto' }}>Quét ngay</button>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost btn-sm" onClick={onClose}>Đóng</button>
          <button className="btn btn-primary btn-sm" onClick={() => { onEdit(tx); onClose(); }}>
            {IC.edit(14)} Chỉnh sửa
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Transaction Modal (Add / Edit) ────────────────────────────────────────────
function TxModal({ editing, categories, members, onClose, onSave }) {
  const [form, setForm] = useState(editing ? { ...editing } : {
    date: new Date().toISOString().split('T')[0], type: 'expense', amount: '', categoryId: '', memberId: '', recipientName: '', note: '',
  });
  const filteredCats = categories.filter(c => c.type === form.type);
  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }

  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">{editing ? 'Chỉnh sửa giao dịch' : 'Thêm giao dịch mới'}</div>
          <button className="icon-btn" style={{ border: 'none', width: 32, height: 32 }} onClick={onClose}>{IC.x(16)}</button>
        </div>
        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Type toggle */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {['income','expense'].map(t => (
              <button key={t} onClick={() => set('type', t)}
                style={{ padding: '11px 12px', borderRadius: 10, cursor: 'pointer', fontWeight: 600, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'all .15s', border: '2px solid', fontFamily: 'inherit',
                  borderColor: form.type === t ? (t === 'income' ? 'var(--income)' : 'var(--expense)') : 'var(--border)',
                  background:  form.type === t ? (t === 'income' ? 'var(--income-light)' : 'var(--expense-light)') : 'transparent',
                  color:       form.type === t ? (t === 'income' ? 'var(--income)' : 'var(--expense)') : 'var(--text-3)',
                }}>
                {t === 'income' ? IC.arrowUp(16) : IC.arrowDown(16)}
                {t === 'income' ? 'Thu vào' : 'Chi ra'}
              </button>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="input-group">
              <label className="input-label">Ngày *</label>
              <input type="date" className="input" value={form.date} onChange={e => set('date', e.target.value)} />
            </div>
            <div className="input-group">
              <label className="input-label">Số tiền (VND) *</label>
              <input type="number" className="input" style={{ fontFamily: 'Space Grotesk' }} value={form.amount} onChange={e => set('amount', e.target.value)} placeholder="0" min="0" />
            </div>
          </div>
          <div className="input-group">
            <label className="input-label">Danh mục *</label>
            <select className="input" value={form.categoryId} onChange={e => set('categoryId', e.target.value)}>
              <option value="">-- Chọn danh mục --</option>
              {filteredCats.map(c => <option key={c.id} value={c.id}>{c.code} · {c.name}</option>)}
            </select>
          </div>
          {form.type === 'income' && (
            <div className="input-group">
              <label className="input-label">Thành viên</label>
              <select className="input" value={form.memberId || ''} onChange={e => set('memberId', e.target.value)}>
                <option value="">-- Không chọn --</option>
                {members.map(m => <option key={m.id} value={m.id}>{m.code} · {m.name}</option>)}
              </select>
            </div>
          )}
          <div className="input-group">
            <label className="input-label">Tên người nhận / nộp</label>
            <input type="text" className="input" value={form.recipientName || ''} onChange={e => set('recipientName', e.target.value)} placeholder="Nhập tên..." />
          </div>
          <div className="input-group">
            <label className="input-label">Đính kèm chứng từ</label>
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '8px 14px', border: '1.5px dashed var(--border)', borderRadius: 8, cursor: 'pointer', fontSize: 13, color: 'var(--text-3)', width: 'fit-content' }}>
              {IC.paperclip(15)} Chọn tệp (ảnh / PDF)
              <input type="file" style={{ display: 'none' }} accept="image/*,.pdf" />
            </label>
          </div>
          <div className="input-group">
            <label className="input-label">Ghi chú</label>
            <textarea className="input" value={form.note || ''} onChange={e => set('note', e.target.value)} placeholder="Ghi chú thêm..." style={{ minHeight: 70 }} />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost btn-sm" onClick={onClose}>Hủy</button>
          <button className="btn btn-primary btn-sm" onClick={() => onSave(form)}>
            {IC.check(15)} {editing ? 'Lưu thay đổi' : 'Thêm giao dịch'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Delete Confirm Modal ──────────────────────────────────────────────────────
function DeleteModal({ onClose, onConfirm }) {
  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal-box" style={{ maxWidth: 360 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">Xác nhận xóa</div>
          <button className="icon-btn" style={{ border: 'none', width: 32, height: 32 }} onClick={onClose}>{IC.x(16)}</button>
        </div>
        <div className="modal-body">
          <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--expense-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--expense)', flexShrink: 0 }}>{IC.alert(20)}</div>
            <div>
              <div style={{ fontWeight: 600, marginBottom: 6 }}>Xóa giao dịch này?</div>
              <div style={{ fontSize: 13, color: 'var(--text-3)' }}>Hành động này không thể hoàn tác. Dữ liệu sẽ bị xóa vĩnh viễn.</div>
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost btn-sm" onClick={onClose}>Hủy</button>
          <button className="btn btn-sm" style={{ background: 'var(--expense)', color: 'white' }} onClick={onConfirm}>{IC.trash(15)} Xóa</button>
        </div>
      </div>
    </div>
  );
}

// ── Transactions Page ─────────────────────────────────────────────────────────
function Transactions() {
  const { showAddTx, setShowAddTx } = useApp();
  const [categories, setCategories] = useState([]);
  const [members, setMembers] = useState([]);
  const [txList,   setTxList]   = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [monthFilter, setMonthFilter] = useState('');
  const [editing,  setEditing]  = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [viewing,  setViewing]  = useState(null);

  // Load initial data
  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const [txData, catData, memData] = await Promise.all([
        DataAdapter.getTransactions(),
        DataAdapter.getCategories(),
        DataAdapter.getMembers(),
      ]);
      setTxList(txData);
      setCategories(catData);
      setMembers(memData);
    } catch (error) {
      console.error('Failed to load data:', error);
      Toast.error('Không thể ');
    } finally {
      setLoading(false);
    }
  }

  const filtered = useMemo(() => txList.filter(tx => {
    if (typeFilter !== 'all' && tx.type !== typeFilter) return false;
    if (monthFilter && !tx.date.startsWith(monthFilter)) return false;
    if (search) {
      const q = search.toLowerCase();
      const cat = getCatById(tx.categoryId);
      const mem = getMemberById(tx.memberId);
      return cat?.name.toLowerCase().includes(q) || cat?.code.toLowerCase().includes(q) || mem?.name.toLowerCase().includes(q) || tx.recipientName?.toLowerCase().includes(q) || tx.note?.toLowerCase().includes(q);
    }
    return true;
  }), [txList, search, typeFilter, monthFilter]);

  const sumIncome  = filtered.filter(t => t.type === 'income').reduce((s, t)  => s + t.amount, 0);
  const sumExpense = filtered.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

  async function handleSave(form) {
    try {
      if (editing) {
        // Update existing transaction
        const updated = await DataAdapter.updateTransaction(editing.id, {
          ...form,
          amount: Number(form.amount)
        });
        setTxList(list => list.map(t => t.id === editing.id ? updated : t));
      } else {
        // Add new transaction
        const created = await DataAdapter.addTransaction({
          ...form,
          amount: Number(form.amount)
        });
        setTxList(list => [created, ...list]);
      }
      setEditing(null);
      setShowAddTx(false);
    } catch (error) {
      console.error('Failed to save transaction:', error);
      Toast.error('Không thể ');
    }
  }

  async function handleDelete(id) {
    try {
      await DataAdapter.deleteTransaction(id);
      setTxList(list => list.filter(t => t.id !== id));
      setDeleting(null);
    } catch (error) {
      console.error('Failed to delete transaction:', error);
      Toast.error('Không thể ');
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
        <div style={{ textAlign: 'center', color: 'var(--text-3)' }}>
          <div style={{ fontSize: 14, marginBottom: 8 }}>Đang tải dữ liệu...</div>
          <div style={{ fontSize: 12 }}>Vui lòng đợi</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14 }}>
        {[
          { label: 'Tổng thu (lọc)', value: sumIncome,  color: 'var(--income)',  icon: 'arrowUp',   bg: 'var(--income-light)' },
          { label: 'Tổng chi (lọc)', value: sumExpense, color: 'var(--expense)', icon: 'arrowDown', bg: 'var(--expense-light)' },
          { label: 'Chênh lệch',     value: sumIncome - sumExpense, color: sumIncome >= sumExpense ? 'var(--income)' : 'var(--expense)', icon: 'money', bg: 'var(--primary-light)' },
        ].map((s, i) => (
          <div key={i} className="stat-card" style={{ padding: '14px 18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div className="stat-label">{s.label}</div>
                <div style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 20, color: s.color, marginTop: 4 }}>{formatVND(s.value)}</div>
                <div className="stat-sub">{filtered.length} giao dịch</div>
              </div>
              <div className="stat-icon" style={{ background: s.bg, color: s.color }}>{IC[s.icon](20)}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filter bar */}
      <div className="card" style={{ padding: '12px 14px' }}>
        <div className="filter-row">
          <div className="search-wrap" style={{ flex: 1, minWidth: 200 }}>
            {IC.search(15)}
            <input className="input" style={{ paddingLeft: 34, height: 38, fontSize: 13 }}
              placeholder="Tìm kiếm giao dịch..."
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="chip-group">
            {[['all','Tất cả'],['income','Thu vào'],['expense','Chi ra']].map(([v,l]) => (
              <button key={v} className={'chip' + (typeFilter === v ? ' active-' + v : '')} onClick={() => setTypeFilter(v)}>{l}</button>
            ))}
          </div>
          <input type="month" className="input" style={{ width: 150, height: 38, fontSize: 13 }}
            value={monthFilter} onChange={e => setMonthFilter(e.target.value)} />
          {(search || typeFilter !== 'all' || monthFilter) && (
            <button className="btn btn-ghost btn-sm" style={{ color: 'var(--expense)' }}
              onClick={() => { setSearch(''); setTypeFilter('all'); setMonthFilter(''); }}>
              {IC.x(14)} Xóa lọc
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Ngày</th><th>Loại</th><th>Danh mục</th><th>Người nhận</th>
                <th style={{ textAlign: 'right' }}>Số tiền</th><th>Ghi chú</th>
                <th style={{ textAlign: 'center' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7}><div className="empty-state">{IC.search(32)}<p>Không tìm thấy giao dịch nào</p></div></td></tr>
              ) : filtered.map(tx => {
                const cat = getCatById(tx.categoryId);
                return (
                  <tr key={tx.id}>
                    <td style={{ whiteSpace: 'nowrap', fontSize: 13 }}>{formatDate(tx.date)}</td>
                    <td>
                      <span className={'badge ' + (tx.type === 'income' ? 'badge-income' : 'badge-expense')}>
                        {tx.type === 'income' ? IC.arrowUp(11) : IC.arrowDown(11)} {tx.type === 'income' ? 'Thu' : 'Chi'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13 }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: cat?.color || '#94a3b8', flexShrink: 0 }} />
                        {cat ? `${cat.code} · ${cat.name}` : '—'}
                      </div>
                    </td>
                    <td style={{ fontSize: 13 }}>{tx.recipientName || '—'}</td>
                    <td style={{ textAlign: 'right', fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 13, color: tx.type === 'income' ? 'var(--income)' : 'var(--expense)' }}>
                      {tx.type === 'income' ? '+' : '−'}{formatVNDFull(tx.amount)}
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--text-3)', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tx.note || '—'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                        <button className="icon-btn" style={{ width: 30, height: 30, color: 'var(--text-3)' }}
                          onClick={() => setViewing(tx)} title="Xem chi tiết">{IC.eye(14)}</button>
                        <button className="icon-btn" style={{ width: 30, height: 30, color: 'var(--primary)' }}
                          onClick={() => setEditing(tx)} title="Chỉnh sửa">{IC.edit(14)}</button>
                        <button className="icon-btn" style={{ width: 30, height: 30, color: 'var(--expense)' }}
                          onClick={() => setDeleting(tx.id)} title="Xóa">{IC.trash(14)}</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filtered.length > 0 && (
          <div style={{ padding: '10px 16px', borderTop: '1px solid var(--border)', fontSize: 12, color: 'var(--text-4)' }}>
            Hiển thị {filtered.length} / {txList.length} giao dịch
          </div>
        )}
      </div>

      {viewing  && <TxDetailModal tx={viewing}  onClose={() => setViewing(null)}  onEdit={t => { setViewing(null); setEditing(t); }} />}
      {(showAddTx || editing) && <TxModal editing={editing} categories={categories} members={members} onClose={() => { setEditing(null); setShowAddTx(false); }} onSave={handleSave} />}
      {deleting  && <DeleteModal onClose={() => setDeleting(null)} onConfirm={() => handleDelete(deleting)} />}
    </div>
  );
}

export {  Transactions  };
