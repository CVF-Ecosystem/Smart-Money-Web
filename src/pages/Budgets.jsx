import React, { useState, useEffect } from 'react';
import { ConfirmDialog } from '../sm-confirm.jsx';
import { DataAdapter } from '../sm-data-adapter.js';
import { Toast } from '../sm-toast.jsx';
import { IC } from '../sm-icons.jsx';
import { formatVND, formatVNDFull } from '../sm-data.js';
import { MOCK_DATA } from '../sm-data.js';

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
      Toast.error('Vui lòng điền đầy đủ thông tin');
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
      Toast.error('Không thể lưu ngân sách: ' + ' ' + error.message);
    }
  }

  async function handleDelete(id) {
    if (!await ConfirmDialog.show('Xác nhận xóa', 'Bạn có chắc chắn muốn xóa ngân sách này?')) return;
    
    try {
      await DataAdapter.deleteBudget(id);
      loadData();
    } catch (error) {
      console.error('Failed to delete budget:', error);
      Toast.error('Không thể xóa ngân sách: ' + ' ' + error.message);
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


export default Budgets;
