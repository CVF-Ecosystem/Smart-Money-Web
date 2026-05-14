import React, { useState, useEffect } from 'react';
import { ConfirmDialog } from '../sm-confirm.jsx';
import { DataAdapter } from '../sm-data-adapter.js';
import { Toast } from '../sm-toast.jsx';
import { IC } from '../sm-icons.jsx';
import { formatVND, formatVNDFull } from '../sm-data.js';
import { MOCK_DATA } from '../sm-data.js';

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
      Toast.error('Vui lòng điền đầy đủ thông tin');
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
      Toast.error('Không thể lưu danh mục: ' + ' ' + error.message);
    }
  }

  async function handleDelete(id) {
    if (!await ConfirmDialog.show('Xác nhận xóa', 'Bạn có chắc chắn muốn xóa danh mục này?')) return;
    
    try {
      await DataAdapter.deleteCategory(id);
      loadCategories();
    } catch (error) {
      console.error('Failed to delete category:', error);
      Toast.error('Không thể xóa danh mục: ' + ' ' + error.message);
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


export default Categories;
