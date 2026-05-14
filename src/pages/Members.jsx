import React, { useState, useEffect } from 'react';
import { ConfirmDialog } from '../sm-confirm.jsx';
import { DataAdapter } from '../sm-data-adapter.js';
import { Toast } from '../sm-toast.jsx';
import { IC } from '../sm-icons.jsx';
import { formatVND, formatVNDFull } from '../sm-data.js';
import { MOCK_DATA } from '../sm-data.js';

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
      Toast.error('Không thể tải danh sách thành viên: ' + error.message);
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
      Toast.error('Không thể lưu thành viên: ' + error.message);
    }
  }

  async function handleDelete(id) {
    if (!await ConfirmDialog.show('Xác nhận xóa', 'Bạn có chắc chắn muốn xóa thành viên này?')) return;
    
    try {
      await DataAdapter.deleteMember(id);
      loadMembers();
    } catch (error) {
      console.error('Failed to delete member:', error);
      Toast.error('Không thể xóa thành viên: ' + error.message);
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


export default Members;
