import React, { useState, useEffect } from 'react';
import { ConfirmDialog } from '../sm-confirm.jsx';
import { DataAdapter } from '../sm-data-adapter.js';
import { Toast } from '../sm-toast.jsx';
import { IC } from '../sm-icons.jsx';
import { formatVND, formatVNDFull } from '../sm-data.js';
import { MOCK_DATA } from '../sm-data.js';

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
      Toast.error('Vui lòng điền đầy đủ thông tin');
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
      Toast.error('Không thể lưu giao dịch định kỳ: ' + error.message);
    }
  }

  async function handleDelete(id) {
    if (!await ConfirmDialog.show('Xác nhận xóa', 'Bạn có chắc chắn muốn xóa giao dịch định kỳ này?')) return;
    
    try {
      await DataAdapter.deleteRecurringTransaction(id);
      loadData();
    } catch (error) {
      console.error('Failed to delete recurring:', error);
      Toast.error('Không thể xóa giao dịch định kỳ: ' + error.message);
    }
  }

  async function handleToggleActive(id, isActive) {
    try {
      await DataAdapter.updateRecurringTransaction(id, { is_active: !isActive });
      loadData();
    } catch (error) {
      console.error('Failed to toggle recurring:', error);
      Toast.error('Không thể cập nhật trạng thái: ' + error.message);
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


export default Recurring;
