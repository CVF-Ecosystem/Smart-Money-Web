import React, { useState, useMemo, useEffect } from 'react';
import { ConfirmDialog } from './sm-confirm.jsx';
import { DataAdapter } from './sm-data-adapter.js';
import { IC } from './sm-icons.jsx';
import { Toast } from './sm-toast.jsx';
import { useApp } from './sm-layout.jsx';

const formatVND = (n) => {
  if (!n && n !== 0) return '—';
  const abs = Math.abs(n);
  if (abs >= 1e9) return (n / 1e9).toFixed(1).replace('.0', '') + ' tỷ';
  if (abs >= 1e6) return (n / 1e6).toFixed(1).replace('.0', '') + ' tr';
  return n.toLocaleString('vi-VN') + 'đ';
};
const formatVNDFull = (n) => {
  if (!n && n !== 0) return '—';
  return Math.abs(n).toLocaleString('vi-VN') + 'đ';
};
const formatDate = (dateStr, short = false) => {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (short) return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
  return d.toLocaleDateString('vi-VN');
};
const formatTS = (ts) => {
  if (!ts) return '—';
  return new Date(ts).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' });
};


/* ── Helpers ───────────────────────────────────────────────────────────────── */
function getSpendByGroup(txList, cats, monthPrefix) {
  const result = {};
  txList.forEach(tx => {
    if (monthPrefix && !tx.date.startsWith(monthPrefix)) return;
    const cat = cats.find(c => c.id === tx.categoryId);
    if (cat) result[cat.group] = (result[cat.group] || 0) + tx.amount;
  });
  return result;
}
function budgetLevel(spent, budget) {
  if (!budget) return 'good';
  const p = spent / budget;
  return p >= 1 ? 'over' : p >= 0.8 ? 'warn' : 'good';
}
const LEVEL_COLOR = { good: 'var(--income)', warn: 'var(--warning)', over: 'var(--expense)' };
const LEVEL_LABEL = { good: null, warn: '⚡ 80%', over: '⚠ Vượt!' };

/* ── Charts ────────────────────────────────────────────────────────────────── */
function PersonalSpendDonut({ txList, cats, groups, monthPrefix }) {
  const data = groups.map(g => {
    const ids = new Set(cats.filter(c => c.group === g.key).map(c => c.id));
    const total = txList.filter(t => (!monthPrefix || t.date.startsWith(monthPrefix)) && ids.has(t.categoryId)).reduce((s, t) => s + t.amount, 0);
    return { ...g, total };
  }).filter(g => g.total > 0);
  const grand = data.reduce((s, g) => s + g.total, 0);
  if (!grand) return <div style={{ padding: '16px 0', textAlign: 'center', fontSize: 13, color: 'var(--text-4)' }}>Chưa có dữ liệu</div>;
  const R = 46, r = 28, cx = 56, cy = 56;
  let a = -Math.PI / 2;
  const arcs = data.map(g => {
    const ang = (g.total / grand) * 2 * Math.PI;
    const [x1,y1] = [cx+R*Math.cos(a), cy+R*Math.sin(a)];
    a += ang;
    const [x2,y2] = [cx+R*Math.cos(a), cy+R*Math.sin(a)];
    const [xi1,yi1] = [cx+r*Math.cos(a), cy+r*Math.sin(a)];
    const [xi2,yi2] = [cx+r*Math.cos(a-ang), cy+r*Math.sin(a-ang)];
    const lg = ang > Math.PI ? 1 : 0;
    return { ...g, d: `M${x1} ${y1} A${R} ${R} 0 ${lg} 1 ${x2} ${y2} L${xi1} ${yi1} A${r} ${r} 0 ${lg} 0 ${xi2} ${yi2}Z` };
  });
  return (
    <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
      <svg width={112} height={112} viewBox="0 0 112 112" style={{ flexShrink: 0 }}>
        {arcs.map((a,i) => <path key={i} d={a.d} fill={a.color} opacity={0.9} />)}
        <circle cx={cx} cy={cy} r={24} fill="var(--surface)" />
        <text x={cx} y={cy-4} textAnchor="middle" fontSize="9" fill="var(--text-3)">Tổng</text>
        <text x={cx} y={cy+9} textAnchor="middle" fontSize="10.5" fontWeight="700" fill="var(--text)" fontFamily="Space Grotesk,sans-serif">{formatVND(grand)}</text>
      </svg>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 7 }}>
        {data.map((g,i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: g.color, flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: 'var(--text-2)', flex: 1 }}>{g.name}</span>
            <span style={{ fontSize: 12, fontFamily: 'Space Grotesk', fontWeight: 700, color: 'var(--text)' }}>{formatVND(g.total)}</span>
            <span style={{ fontSize: 10.5, color: 'var(--text-4)', minWidth: 32, textAlign: 'right' }}>{(g.total/grand*100).toFixed(0)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function WeeklySpendBar({ txList }) {
  const base = new Date();
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(base); d.setDate(d.getDate() - (6 - i));
    const ds = d.toISOString().split('T')[0];
    const lbl = ['CN','T2','T3','T4','T5','T6','T7'][d.getDay()];
    return { ds, lbl, total: txList.filter(t => t.date === ds).reduce((s,t) => s+t.amount, 0) };
  });
  const max = Math.max(...days.map(d => d.total), 1);
  const W = 320, H = 72, bw = 30;
  const colW = W / 7;
  return (
    <svg viewBox={`0 0 ${W} ${H+22}`} style={{ width: '100%', height: 100 }} preserveAspectRatio="none">
      {[0.5,1].map(f => <line key={f} x1={0} y1={H-H*f} x2={W} y2={H-H*f} stroke="var(--border)" strokeWidth="0.5" strokeDasharray="3 3" />)}
      {days.map((d, i) => {
        const bh = Math.max((d.total / max) * H, d.total > 0 ? 3 : 0);
        const cx = i * colW + colW / 2;
        const isToday = d.ds === new Date().toISOString().split('T')[0];
        return (
          <g key={d.ds}>
            <rect x={cx-bw/2} y={H-bh} width={bw} height={bh} rx="4"
              fill={isToday ? '#0D9488' : 'var(--primary)'} opacity={isToday ? 1 : 0.55} />
            {d.total > 0 && <text x={cx} y={H-bh-4} textAnchor="middle" fontSize="8.5" fill={isToday ? '#0D9488' : 'var(--text-3)'}>{formatVND(d.total)}</text>}
            <text x={cx} y={H+15} textAnchor="middle" fontSize="9.5" fill={isToday ? '#0D9488' : 'var(--text-4)'} fontWeight={isToday ? '700' : '400'}>{d.lbl}</text>
          </g>
        );
      })}
    </svg>
  );
}

/* ── Modals ─────────────────────────────────────────────────────────────────── */
function WalletEditModal({ wallet, onClose, onSave }) {
  const [form, setForm] = useState({ name: wallet.name, balance: wallet.balance, limit: wallet.limit || '' });
  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal-box" style={{ maxWidth: 380 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">Chỉnh sửa ví · {wallet.name}</div>
          <button className="icon-btn" style={{ border: 'none' }} onClick={onClose}>{IC.x(16)}</button>
        </div>
        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="input-group"><label className="input-label">Tên ví</label>
            <input className="input" value={form.name} onChange={e => setForm(f=>({...f,name:e.target.value}))} />
          </div>
          <div className="input-group"><label className="input-label">Số dư hiện tại (VND)</label>
            <input type="number" className="input" style={{ fontFamily:'Space Grotesk' }}
              value={form.balance} onChange={e => setForm(f=>({...f,balance:Number(e.target.value)}))} />
          </div>
          {wallet.type === 'credit' && (
            <div className="input-group"><label className="input-label">Hạn mức tín dụng (VND)</label>
              <input type="number" className="input" style={{ fontFamily:'Space Grotesk' }}
                value={form.limit} onChange={e => setForm(f=>({...f,limit:Number(e.target.value)}))} />
            </div>
          )}
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost btn-sm" onClick={onClose}>Hủy</button>
          <button className="btn btn-primary btn-sm" onClick={() => onSave(wallet.id, form)}>{IC.check(14)} Lưu</button>
        </div>
      </div>
    </div>
  );
}

function PersonalTxModal({ editing, onClose, onSave, personalCategories, personalCategoryGroups, personalWallets }) {
  const [form, setForm] = useState(editing ? { ...editing, amount: editing.amount } : { date: new Date().toISOString().split('T')[0], amount: '', categoryId: '', walletId: 'pw1', note: '' });
  const [ocrState, setOcrState] = useState('idle'); // idle | scanning | done
  function set(k, v) { setForm(f => ({...f, [k]: v})); }

  function handleOCR(e) {
    const file = e.target.files[0];
    if (!file) return;
    setOcrState('scanning');
    setTimeout(() => {
      const mockAmt = [35000, 75000, 120000, 45000, 220000][Math.floor(Math.random() * 5)];
      set('amount', mockAmt);
      set('note', file.name.replace(/\.[^.]+$/, ''));
      setOcrState('done');
      setTimeout(() => setOcrState('idle'), 2500);
    }, 1800);
  }

  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">{editing ? 'Sửa chi tiêu cá nhân' : 'Thêm chi tiêu'}</div>
          <button className="icon-btn" style={{ border:'none' }} onClick={onClose}>{IC.x(16)}</button>
        </div>
        <div className="modal-body" style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <div className="input-group"><label className="input-label">Ngày *</label>
              <input type="date" className="input" value={form.date} onChange={e=>set('date',e.target.value)} />
            </div>
            <div className="input-group">
              <label className="input-label" style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <span>Số tiền (VND) *</span>
                <label style={{ cursor:'pointer', display:'flex', alignItems:'center', gap:4, fontWeight:400 }}>
                  {ocrState === 'scanning' ? (
                    <span style={{ fontSize:11.5, color:'var(--text-4)', display:'flex', alignItems:'center', gap:4 }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ animation:'spin 0.8s linear infinite' }}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                      Đang quét...
                    </span>
                  ) : ocrState === 'done' ? (
                    <span style={{ fontSize:11.5, color:'var(--income)', display:'flex', alignItems:'center', gap:4 }}>{IC.checkCircle(12)} OCR xong!</span>
                  ) : (
                    <span style={{ fontSize:11.5, color:'#0D9488', display:'flex', alignItems:'center', gap:4 }}>
                      {IC.zap(12)} Quét hóa đơn
                      <input type="file" style={{ display:'none' }} accept="image/*" onChange={handleOCR} />
                    </span>
                  )}
                </label>
              </label>
              <input type="number" className="input" style={{ fontFamily:'Space Grotesk', borderColor: ocrState==='done'?'var(--income)':undefined }} value={form.amount} onChange={e=>set('amount',e.target.value)} placeholder="0" min="0" />
            </div>
          </div>
          <div className="input-group"><label className="input-label">Danh mục *</label>
            <select className="input" value={form.categoryId} onChange={e=>set('categoryId',e.target.value)}>
              <option value="">-- Chọn danh mục --</option>
              {personalCategoryGroups.map(grp => (
                <optgroup key={grp.key} label={`── ${grp.name} ──`}>
                  {personalCategories.filter(c=>c.group===grp.key).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </optgroup>
              ))}
            </select>
          </div>
          <div className="input-group"><label className="input-label">Ví thanh toán</label>
            <select className="input" value={form.walletId} onChange={e=>set('walletId',e.target.value)}>
              {personalWallets.map(w => <option key={w.id} value={w.id}>{w.name} — {formatVND(w.balance)}</option>)}
            </select>
          </div>
          <div className="input-group"><label className="input-label">Ghi chú</label>
            <input className="input" value={form.note||''} onChange={e=>set('note',e.target.value)} placeholder="VD: Cà phê với đồng nghiệp..." />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost btn-sm" onClick={onClose}>Hủy</button>
          <button className="btn btn-sm" style={{ background:'#0D9488', color:'white' }}
            disabled={!form.amount||!form.categoryId}
            onClick={() => onSave({ ...form, amount: Number(form.amount) })}>
            {IC.check(14)} {editing ? 'Lưu thay đổi' : 'Thêm chi tiêu'}
          </button>
        </div>
      </div>
    </div>
  );
}

function TransferModal({ onClose, personalWallets }) {
  const [amount, setAmount] = useState(150000);
  const [walletId, setWalletId] = useState('pw2');
  const [note, setNote] = useState(`Đóng quỹ T${new Date().getMonth() + 1}/${new Date().getFullYear()}`);
  const [done, setDone] = useState(false);
  async function confirm() { 
    if (await ConfirmDialog.show('Xác nhận', 'Bạn có chắc chắn muốn chuyển tiền?')) {
      setDone(true); setTimeout(onClose, 1800); 
    }
  }
  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal-box" style={{ maxWidth: 440 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title" style={{ display:'flex', alignItems:'center', gap:8 }}>{IC.send(16)} Trích đóng quỹ</div>
          <button className="icon-btn" style={{ border:'none' }} onClick={onClose}>{IC.x(16)}</button>
        </div>
        {done ? (
          <div className="modal-body" style={{ textAlign:'center', padding:'32px 24px' }}>
            <div style={{ width:56,height:56,borderRadius:'50%',background:'var(--income-light)',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 14px',color:'var(--income)' }}>{IC.checkCircle(28)}</div>
            <div style={{ fontFamily:'Space Grotesk',fontSize:17,fontWeight:700,marginBottom:6 }}>Chuyển thành công!</div>
            <div style={{ fontSize:13,color:'var(--text-3)' }}>Đã tạo 1 khoản chi ở Ví cá nhân và 1 khoản thu ở Quỹ chính.</div>
          </div>
        ) : (
          <>
            <div className="modal-body" style={{ display:'flex',flexDirection:'column',gap:14 }}>
              <div style={{ padding:'10px 12px',background:'rgba(13,148,136,0.08)',borderRadius:9,fontSize:13,color:'var(--text-2)',display:'flex',gap:8,alignItems:'flex-start' }}>
                <span style={{ color:'#0D9488',flexShrink:0,marginTop:1 }}>{IC.info(15)}</span>
                <span>Hệ thống tự tạo <strong>2 bản ghi</strong>: 1 khoản <strong>chi</strong> ở Ví cá nhân + 1 khoản <strong>thu</strong> vào Quỹ chính.</span>
              </div>
              <div className="input-group"><label className="input-label">Từ ví</label>
                <select className="input" value={walletId} onChange={e=>setWalletId(e.target.value)}>
                  {personalWallets.map(w => <option key={w.id} value={w.id}>{w.name} — {formatVND(w.balance)}</option>)}
                </select>
              </div>
              <div className="input-group"><label className="input-label">Vào quỹ</label>
                <select className="input"><option>Quỹ chính</option></select>
              </div>
              <div className="input-group"><label className="input-label">Số tiền (VND) *</label>
                <input type="number" className="input" style={{ fontFamily:'Space Grotesk' }} value={amount} onChange={e=>setAmount(Number(e.target.value))} />
              </div>
              <div className="input-group"><label className="input-label">Ghi chú</label>
                <input className="input" value={note} onChange={e=>setNote(e.target.value)} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost btn-sm" onClick={onClose}>Hủy</button>
              <button className="btn btn-sm" style={{ background:'#0D9488',color:'white' }} onClick={confirm}>{IC.send(14)} Xác nhận chuyển</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function CategorizeModal({ item, onClose, onSave, personalCategories, personalCategoryGroups, personalWallets }) {
  const [catId, setCatId] = useState('');
  const [walletId, setWalletId] = useState('pw1');
  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal-box" style={{ maxWidth:400 }} onClick={e=>e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">Phân loại khoản chi</div>
          <button className="icon-btn" style={{ border:'none' }} onClick={onClose}>{IC.x(16)}</button>
        </div>
        <div className="modal-body" style={{ display:'flex',flexDirection:'column',gap:14 }}>
          <div style={{ padding:'12px 14px',background:'var(--surface-2)',borderRadius:9,display:'flex',justifyContent:'space-between',alignItems:'center' }}>
            <div>
              <div style={{ fontSize:11.5,color:'var(--text-4)',marginBottom:2 }}>Khoản chi cần phân loại</div>
              <div style={{ fontWeight:700,fontSize:14 }}>{item.name}</div>
            </div>
            <div style={{ fontFamily:'Space Grotesk',fontWeight:700,color:'var(--expense)',fontSize:16 }}>−{formatVNDFull(item.amount)}</div>
          </div>
          <div className="input-group"><label className="input-label">Danh mục *</label>
            <select className="input" value={catId} onChange={e=>setCatId(e.target.value)}>
              <option value="">-- Chọn danh mục --</option>
              {personalCategoryGroups.map(grp => (
                <optgroup key={grp.key} label={`── ${grp.name} ──`}>
                  {personalCategories.filter(c=>c.group===grp.key).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </optgroup>
              ))}
            </select>
          </div>
          <div className="input-group"><label className="input-label">Ví thanh toán</label>
            <select className="input" value={walletId} onChange={e=>setWalletId(e.target.value)}>
              {personalWallets.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost btn-sm" onClick={onClose}>Hủy</button>
          <button className="btn btn-primary btn-sm" disabled={!catId} onClick={()=>onSave(item.id,catId,walletId)}>{IC.check(14)} Phân loại</button>
        </div>
      </div>
    </div>
  );
}

function ContributeModal({ goal, onClose, onSave }) {
  const [amount, setAmount] = useState('');
  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal-box" style={{ maxWidth:360 }} onClick={e=>e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">{goal.emoji} Nạp tiền · {goal.name}</div>
          <button className="icon-btn" style={{ border:'none' }} onClick={onClose}>{IC.x(16)}</button>
        </div>
        <div className="modal-body" style={{ display:'flex',flexDirection:'column',gap:14 }}>
          <div style={{ textAlign:'center',padding:'14px 0 8px' }}>
            <div style={{ fontSize:12,color:'var(--text-4)',marginBottom:4 }}>Đã tiết kiệm</div>
            <div style={{ fontFamily:'Space Grotesk',fontSize:28,fontWeight:800,color:goal.color }}>{formatVNDFull(goal.saved)}</div>
            <div style={{ fontSize:12,color:'var(--text-3)',marginTop:3 }}>trên tổng {formatVNDFull(goal.target)}</div>
          </div>
          <div className="input-group"><label className="input-label">Số tiền nạp (VND) *</label>
            <input type="number" className="input" style={{ fontFamily:'Space Grotesk',fontSize:15 }}
              placeholder="500000" value={amount} onChange={e=>setAmount(e.target.value)} autoFocus />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost btn-sm" onClick={onClose}>Hủy</button>
          <button className="btn btn-sm" disabled={!amount||Number(amount)<=0}
            style={{ background:goal.color,color:'white' }} onClick={()=>onSave(goal.id,Number(amount))}>
            {IC.plus(14)} Nạp vào heo
          </button>
        </div>
      </div>
    </div>
  );
}

function GoalEditModal({ goal, onClose, onSave }) {
  const [form, setForm] = useState({ name:goal.name, target:goal.target, deadline:goal.deadline||'', emoji:goal.emoji, color:goal.color });
  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal-box" style={{ maxWidth:420 }} onClick={e=>e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">Chỉnh sửa heo đất</div>
          <button className="icon-btn" style={{ border:'none' }} onClick={onClose}>{IC.x(16)}</button>
        </div>
        <div className="modal-body" style={{ display:'flex',flexDirection:'column',gap:14 }}>
          <div style={{ display:'grid',gridTemplateColumns:'60px 1fr',gap:10 }}>
            <div className="input-group"><label className="input-label">Icon</label>
              <input className="input" style={{ textAlign:'center',fontSize:20 }} value={form.emoji} onChange={e=>setForm(f=>({...f,emoji:e.target.value}))} maxLength={2} />
            </div>
            <div className="input-group"><label className="input-label">Tên mục tiêu *</label>
              <input className="input" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} />
            </div>
          </div>
          <div className="input-group"><label className="input-label">Số tiền mục tiêu (VND) *</label>
            <input type="number" className="input" style={{ fontFamily:'Space Grotesk' }} value={form.target} onChange={e=>setForm(f=>({...f,target:Number(e.target.value)}))} />
          </div>
          <div className="input-group"><label className="input-label">Hạn chót</label>
            <input type="date" className="input" value={form.deadline} onChange={e=>setForm(f=>({...f,deadline:e.target.value}))} />
          </div>
          <div className="input-group"><label className="input-label">Màu sắc</label>
            <div style={{ display:'flex',gap:8 }}>
              {['#7C3AED','#0891B2','#059669','#D97706','#DC2626','#0D9488'].map(c=>(
                <button key={c} onClick={()=>setForm(f=>({...f,color:c}))}
                  style={{ width:30,height:30,borderRadius:'50%',background:c,border:form.color===c?'3px solid var(--text-2)':'3px solid transparent',cursor:'pointer',padding:0,transition:'border .15s' }} />
              ))}
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost btn-sm" onClick={onClose}>Hủy</button>
          <button className="btn btn-sm" disabled={!form.name||!form.target} style={{ background:form.color,color:'white' }} onClick={()=>onSave(goal.id,form)}>
            {IC.check(14)} Lưu thay đổi
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Wallet Card ─────────────────────────────────────────────────────────────── */
function WalletCard({ wallet, onEdit }) {
  const isCredit = wallet.type === 'credit';
  const bal = wallet.balance;
  return (
    <div className="card" style={{ padding:'18px 20px', borderTop:`3px solid ${wallet.color}`, position:'relative' }}>
      <button className="icon-btn" style={{ position:'absolute',top:10,right:10,width:28,height:28,color:'var(--text-4)',border:'none',borderRadius:7 }}
        onClick={()=>onEdit(wallet)} title="Chỉnh sửa ví">{IC.edit(13)}</button>
      <div style={{ display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:8 }}>
        <div style={{ width:38,height:38,borderRadius:10,background:wallet.color+'18',display:'flex',alignItems:'center',justifyContent:'center',color:wallet.color }}>
          {isCredit ? IC.creditCard(20) : IC.wallet(20)}
        </div>
      </div>
      <div style={{ fontSize:11,color:'var(--text-4)',fontWeight:600,textTransform:'uppercase',letterSpacing:'.7px',marginBottom:5 }}>
        {wallet.type==='cash'?'Tiền mặt':wallet.type==='atm'?'Tài khoản ATM':'Thẻ tín dụng'}
      </div>
      <div style={{ fontFamily:'Space Grotesk',fontSize:22,fontWeight:700,color:bal<0?'var(--expense)':'var(--text)',letterSpacing:'-.5px',marginBottom:2 }}>
        {formatVNDFull(Math.abs(bal))}
      </div>
      <div style={{ fontSize:12.5,fontWeight:600,color:'var(--text-3)',marginBottom: isCredit && wallet.limit ? 10 : 0 }}>{wallet.name}</div>
      {isCredit && wallet.limit && (
        <div>
          <div style={{ display:'flex',justifyContent:'space-between',fontSize:11,color:'var(--text-4)',marginBottom:4 }}>
            <span>Đã dùng {(Math.abs(bal)/wallet.limit*100).toFixed(0)}%</span>
            <span>Hạn mức {formatVND(wallet.limit)}</span>
          </div>
          <div className="progress-track">
            <div className="progress-fill" style={{ width:Math.min(Math.abs(bal)/wallet.limit*100,100)+'%', background:Math.abs(bal)/wallet.limit>0.8?'var(--expense)':'var(--warning)' }} />
          </div>
        </div>
      )}
      {bal < 0 && <div style={{ fontSize:11,color:'var(--expense)',marginTop:4,fontWeight:600 }}>Dư nợ</div>}
    </div>
  );
}

/* ── Daily Allowance Hero ─────────────────────────────────────────────────────── */
function AllowanceHero({ txList, cats, salary }) {
  const mp = new Date().toISOString().slice(0, 7);
  const fixedIds = new Set(cats.filter(c=>c.group==='fixed').map(c=>c.id));
  const fixedSpent = txList.filter(t=>t.date.startsWith(mp)&&fixedIds.has(t.categoryId)).reduce((s,t)=>s+t.amount,0);
  const available = salary - fixedSpent;
  const today = new Date();
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const remaining = Math.max(1, daysInMonth - today.getDate() + 1);
  const dailyAllow = Math.max(0, available / remaining);
  const spentToday = txList.filter(t=>t.date===new Date().toISOString().split('T')[0]).reduce((s,t)=>s+t.amount,0);
  const totalMonth = txList.filter(t=>t.date.startsWith(mp)).reduce((s,t)=>s+t.amount,0);
  const overToday  = spentToday > dailyAllow;
  return (
    <div style={{ background:'linear-gradient(130deg,#0f766e 0%,#0891B2 55%,#0D9488 100%)',borderRadius:16,padding:'26px 30px',color:'white',position:'relative',overflow:'hidden' }}>
      <div style={{ position:'absolute',right:-30,top:-30,width:180,height:180,borderRadius:'50%',background:'rgba(255,255,255,0.06)' }} />
      <div style={{ position:'absolute',right:60,bottom:-50,width:130,height:130,borderRadius:'50%',background:'rgba(255,255,255,0.04)' }} />
      <div style={{ position:'relative',display:'flex',justifyContent:'space-between',alignItems:'flex-start' }}>
        <div>
          <div style={{ fontSize:12,opacity:0.75,fontWeight:500,marginBottom:6 }}>Ngân sách mỗi ngày · T{new Date().getMonth() + 1}/{new Date().getFullYear()}</div>
          <div style={{ fontFamily:'Space Grotesk',fontSize:36,fontWeight:800,letterSpacing:'-1px',lineHeight:1 }}>{formatVND(dailyAllow)}</div>
          <div style={{ marginTop:14,display:'flex',gap:18,flexWrap:'wrap' }}>
            {[['Lương tháng',formatVND(salary)],['Chi cố định',formatVND(fixedSpent)],['Còn lại',formatVND(available)],[`Chi T${new Date().getMonth()+1}`,formatVND(totalMonth)]].map(([l,v],i,arr)=>(
              <div key={l} style={{ display:'flex' }}>
                <div>
                  <div style={{ fontSize:10.5,opacity:.6,marginBottom:2 }}>{l}</div>
                  <div style={{ fontFamily:'Space Grotesk',fontWeight:600,fontSize:14 }}>{v}</div>
                </div>
                {i<arr.length-1 && <div style={{ width:1,background:'rgba(255,255,255,0.2)',margin:'0 18px' }} />}
              </div>
            ))}
          </div>
        </div>
        <div style={{ textAlign:'right',minWidth:110 }}>
          <div style={{ fontSize:11,opacity:.65,marginBottom:4 }}>Hôm nay đã chi</div>
          <div style={{ fontFamily:'Space Grotesk',fontSize:22,fontWeight:700,color:overToday?'#FCA5A5':'white' }}>{formatVND(spentToday)}</div>
          {overToday && <div style={{ fontSize:11,color:'#FCA5A5',marginTop:4 }}>⚠ Vượt hạn mức!</div>}
          <div style={{ fontSize:11,opacity:.55,marginTop:8 }}>{remaining} ngày còn lại T{new Date().getMonth()+1}</div>
        </div>
      </div>
    </div>
  );
}

/* ── MY WALLET PAGE ──────────────────────────────────────────────────────────── */
function MyWallet() {
  const [data, setData] = useState(null);
  const [wallets, setWallets]   = useState([]);
  const [showTransfer, setShowTransfer] = useState(false);
  const [editingWallet, setEditingWallet] = useState(null);
  const mp = new Date().toISOString().slice(0, 7);

  useEffect(() => {
    DataAdapter.getPersonalData().then(d => {
      setData(d);
      setWallets([...d.wallets]);
    });
  }, []);

  if (!data) return <div style={{padding:20}}>Đang tải...</div>;
  const { categories: personalCategories, categoryGroups: personalCategoryGroups, transactions: personalTransactions, budgets: personalBudgets, salaryInfo } = data;
  
  const totalBalance   = wallets.reduce((s,w) => s + w.balance, 0);
  const spendByGroup   = getSpendByGroup(personalTransactions, personalCategories, mp);

  function saveWallet(id, form) {
    setWallets(ws => ws.map(w => w.id===id ? {...w, ...form} : w));
    setEditingWallet(null);
  }

  return (
    <div style={{ display:'flex',flexDirection:'column',gap:18 }}>
      <AllowanceHero txList={personalTransactions} cats={personalCategories} salary={salaryInfo.monthlySalary} />

      {/* Wallet cards */}
      <div style={{ display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:14 }}>
        {wallets.map(w => <WalletCard key={w.id} wallet={w} onEdit={setEditingWallet} />)}
      </div>
      <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center' }}>
        <span style={{ fontSize:13,color:'var(--text-3)' }}>
          Tổng tài sản ròng: <strong style={{ fontFamily:'Space Grotesk',color:totalBalance>=0?'var(--income)':'var(--expense)',fontSize:15 }}>{formatVNDFull(totalBalance)}</strong>
        </span>
        <div style={{ display:'flex',gap:10 }}>
          <button className="btn btn-sm" style={{ background:'#0D9488',color:'white' }} onClick={()=>setShowTransfer(true)}>{IC.send(14)} Trích đóng quỹ</button>
          <button className="btn btn-ghost btn-sm">{IC.download(14)} Xuất báo cáo</button>
        </div>
      </div>

      {/* Charts + Budget — side by side */}
      <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:16 }}>
        <div className="card" style={{ padding:'18px 20px' }}>
          <div className="section-title">Chi tiêu theo nhóm · T{new Date().getMonth()+1}/{new Date().getFullYear()}</div>
          <PersonalSpendDonut txList={personalTransactions} cats={personalCategories} groups={personalCategoryGroups} monthPrefix={mp} />
        </div>
        <div className="card" style={{ padding:'18px 20px' }}>
          <div className="section-title">Ngân sách theo nhóm · T{new Date().getMonth()+1}/{new Date().getFullYear()}</div>
          <div style={{ display:'flex',flexDirection:'column',gap:10 }}>
            {personalCategoryGroups.map(grp => {
              const spent = spendByGroup[grp.key]||0;
              const budget = personalBudgets.categories[grp.key]||0;
              const pct = budget ? Math.min(spent/budget*100,100) : 0;
              const lvl = budgetLevel(spent, budget);
              return (
                <div key={grp.key}>
                  <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:5 }}>
                    <div style={{ display:'flex',alignItems:'center',gap:7 }}>
                      <span style={{ width:8,height:8,borderRadius:'50%',background:grp.color }} />
                      <span style={{ fontSize:12.5,fontWeight:600,color:'var(--text-2)' }}>{grp.name}</span>
                    </div>
                    <div style={{ display:'flex',alignItems:'center',gap:8 }}>
                      {LEVEL_LABEL[lvl] && <span style={{ fontSize:10.5,fontWeight:800,color:LEVEL_COLOR[lvl] }}>{LEVEL_LABEL[lvl]}</span>}
                      <span style={{ fontSize:12,fontFamily:'Space Grotesk',fontWeight:700,color:LEVEL_COLOR[lvl] }}>{formatVND(spent)}</span>
                      <span style={{ fontSize:11,color:'var(--text-4)' }}>/ {formatVND(budget)}</span>
                    </div>
                  </div>
                  <div className="progress-track" style={{ height:5 }}>
                    <div className="progress-fill" style={{ width:pct+'%',background:LEVEL_COLOR[lvl] }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent personal transactions */}
      <div className="card">
        <div style={{ padding:'14px 20px',borderBottom:'1px solid var(--border)',display:'flex',justifyContent:'space-between',alignItems:'center' }}>
          <div className="section-title" style={{ marginBottom:0 }}>Giao dịch cá nhân · T{new Date().getMonth() + 1}/{new Date().getFullYear()}</div>
          <span className="badge badge-neutral">{personalTransactions.length} giao dịch</span>
        </div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Ngày</th><th>Danh mục</th><th>Ví</th><th style={{ textAlign:'right' }}>Số tiền</th><th>Ghi chú</th></tr></thead>
            <tbody>
              {personalTransactions.map(tx => {
                const cat = personalCategories.find(c=>c.id===tx.categoryId);
                const grp = personalCategoryGroups.find(g=>g.key===cat?.group);
                const wal = personalWallets.find(w=>w.id===tx.walletId);
                return (
                  <tr key={tx.id}>
                    <td style={{ fontSize:13,whiteSpace:'nowrap' }}>{formatDate(tx.date,true)}</td>
                    <td><div style={{ display:'flex',alignItems:'center',gap:7 }}>
                      <span style={{ width:8,height:8,borderRadius:'50%',background:cat?.color||'#94a3b8',flexShrink:0 }} />
                      <span style={{ fontSize:13 }}>{cat?.name||'—'}</span>
                      {grp && <span style={{ fontSize:10,background:grp.color+'18',color:grp.color,padding:'1px 7px',borderRadius:4,fontWeight:700 }}>{grp.name}</span>}
                    </div></td>
                    <td style={{ fontSize:12,color:'var(--text-3)' }}>{wal?.name||'—'}</td>
                    <td style={{ textAlign:'right',fontFamily:'Space Grotesk',fontWeight:700,fontSize:13,color:'var(--expense)' }}>−{formatVNDFull(tx.amount)}</td>
                    <td style={{ fontSize:12,color:'var(--text-3)',maxWidth:180,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{tx.note||'—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {showTransfer && <TransferModal onClose={()=>setShowTransfer(false)} personalWallets={wallets} />}
      {editingWallet && <WalletEditModal wallet={editingWallet} onClose={()=>setEditingWallet(null)} onSave={saveWallet} />}
    </div>
  );
}

/* ── DAILY SPEND PAGE ─────────────────────────────────────────────────────────── */
function DailySpend() {
  const { showAddTx, setShowAddTx } = useApp();
  const [data, setData] = useState(null);
  const [txList,  setTxList]  = useState([]);
  const [pending, setPending] = useState([]);
  const [qAmt, setQAmt]       = useState('');
  const [qName, setQName]     = useState('');
  const [search, setSearch]   = useState('');
  const [groupFilter, setGroupFilter] = useState('all');
  const [catModal, setCatModal] = useState(null);
  const [editingTx, setEditingTx] = useState(null);
  const [addingNew, setAddingNew] = useState(false);
  const [deletingTx, setDeletingTx] = useState(null);
  const mp = new Date().toISOString().slice(0, 7);

  useEffect(() => {
    DataAdapter.getPersonalData().then(d => {
      setData(d);
      setTxList([...d.transactions]);
      setPending([...d.pendingItems]);
    });
  }, []);

  if (!data) return <div style={{padding:20}}>Đang tải...</div>;
  const { categories: personalCategories, categoryGroups: personalCategoryGroups, wallets: personalWallets, budgets: personalBudgets } = data;

  // Open add modal from header button
  React.useEffect(() => { if (showAddTx) { setAddingNew(true); setShowAddTx(false); } }, [showAddTx]);

  function addPending() {
    const amt = Number(qAmt);
    if (!amt || !qName.trim()) return;
    setPending(p => [{ id:'pi_'+Date.now(), amount:amt, name:qName.trim(), ts:new Date().toISOString() }, ...p]);
    setQAmt(''); setQName('');
  }

  function categorizePending(id, catId, walletId) {
    const item = pending.find(p=>p.id===id);
    if (!item) return;
    setTxList(l => [{ id:'pt_'+Date.now(), date:new Date().toISOString().split('T')[0], amount:item.amount, categoryId:catId, walletId, note:item.name }, ...l]);
    setPending(p => p.filter(x=>x.id!==id));
    setCatModal(null);
  }

  function saveTx(form) {
    if (editingTx) setTxList(l => l.map(t => t.id===editingTx.id ? {...t,...form} : t));
    else setTxList(l => [{ ...form, id:'pt_'+Date.now() }, ...l]);
    setEditingTx(null); setAddingNew(false);
  }

  const spendByGroup = getSpendByGroup(txList, personalCategories, mp);
  const overGroups = personalCategoryGroups.filter(g => budgetLevel(spendByGroup[g.key]||0, personalBudgets.categories[g.key]) !== 'good');

  const filtered = useMemo(() => txList.filter(tx => {
    if (groupFilter !== 'all') { const cat = personalCategories.find(c=>c.id===tx.categoryId); if (!cat||cat.group!==groupFilter) return false; }
    if (search) { const cat = personalCategories.find(c=>c.id===tx.categoryId); const wal = personalWallets.find(w=>w.id===tx.walletId); const q=search.toLowerCase(); return cat?.name.toLowerCase().includes(q)||wal?.name.toLowerCase().includes(q)||tx.note?.toLowerCase().includes(q); }
    return true;
  }), [txList, groupFilter, search]);

  const totalFiltered = filtered.reduce((s,t)=>s+t.amount,0);

  return (
    <div style={{ display:'flex',flexDirection:'column',gap:16 }}>

      {/* Budget warning */}
      {overGroups.length > 0 && (
        <div style={{ padding:'12px 16px',borderRadius:10,background:overGroups.some(g=>budgetLevel(spendByGroup[g.key]||0,personalBudgets.categories[g.key])==='over')?'var(--expense-light)':'var(--warning-light)',border:`1px solid ${overGroups.some(g=>budgetLevel(spendByGroup[g.key]||0,personalBudgets.categories[g.key])==='over')?'var(--expense)':'var(--warning)'}`,display:'flex',alignItems:'flex-start',gap:10 }}>
          <span style={{ color:'var(--warning)',flexShrink:0 }}>{IC.alert(18)}</span>
          <div>
            <div style={{ fontWeight:700,fontSize:13,color:'var(--text)',marginBottom:4 }}>Cảnh báo ngân sách</div>
            <div style={{ display:'flex',gap:14,flexWrap:'wrap' }}>
              {overGroups.map(g => { const s=spendByGroup[g.key]||0,b=personalBudgets.categories[g.key],lvl=budgetLevel(s,b);
                return <span key={g.key} style={{ fontSize:12.5 }}><strong style={{ color:LEVEL_COLOR[lvl] }}>{g.name}</strong>: {formatVND(s)} / {formatVND(b)} ({(s/b*100).toFixed(0)}%)</span>; })}
            </div>
          </div>
        </div>
      )}

      {/* Weekly chart + Quick entry — side by side */}
      <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:14 }}>
        <div className="card" style={{ padding:'16px 18px' }}>
          <div className="section-title">Chi tiêu 7 ngày qua</div>
          <WeeklySpendBar txList={txList} />
        </div>
        <div className="card" style={{ padding:'16px 18px' }}>
          <div style={{ fontSize:13,fontWeight:700,color:'var(--text-2)',marginBottom:12,display:'flex',alignItems:'center',gap:8 }}>{IC.zap(15)} Nhập nhanh chi tiêu</div>
          <div style={{ display:'flex',flexDirection:'column',gap:10 }}>
            <div style={{ display:'flex',gap:8 }}>
              <input type="number" className="input" style={{ width:130,height:40,fontFamily:'Space Grotesk',fontSize:14 }}
                placeholder="50.000" value={qAmt} onChange={e=>setQAmt(e.target.value)} onKeyDown={e=>e.key==='Enter'&&addPending()} />
              <input type="text" className="input" style={{ flex:1,height:40 }}
                placeholder="Cà phê, gửi xe..." value={qName} onChange={e=>setQName(e.target.value)} onKeyDown={e=>e.key==='Enter'&&addPending()} />
            </div>
            <div style={{ display:'flex',gap:8 }}>
              <button className="btn btn-sm" style={{ background:'#0D9488',color:'white',flex:1 }}
                onClick={addPending} disabled={!qAmt||!qName.trim()}>{IC.inbox(14)} → Ví Tạm</button>
              <button className="btn btn-sm" style={{ background:'var(--primary)',color:'white',flex:1 }}
                onClick={()=>setAddingNew(true)}>{IC.plus(14)} Chi đầy đủ</button>
            </div>
          </div>
        </div>
      </div>

      {/* Pending Box */}
      {pending.length > 0 && (
        <div className="card" style={{ border:'1.5px solid var(--warning)' }}>
          <div style={{ padding:'12px 18px',borderBottom:'1px solid var(--border)',display:'flex',alignItems:'center',gap:10 }}>
            <span style={{ color:'var(--warning)' }}>{IC.inbox(16)}</span>
            <div style={{ fontWeight:700,fontSize:13 }}>Ví Tạm — Chưa phân loại</div>
            <span className="badge badge-warning" style={{ marginLeft:'auto' }}>{pending.length} khoản</span>
          </div>
          <div style={{ padding:'8px 12px',display:'flex',flexDirection:'column',gap:6 }}>
            {pending.map(item => (
              <div key={item.id} style={{ display:'flex',alignItems:'center',gap:10,padding:'9px 10px',borderRadius:8,background:'var(--surface-2)' }}>
                <div style={{ flex:1,minWidth:0 }}>
                  <div style={{ fontWeight:600,fontSize:13 }}>{item.name}</div>
                  <div style={{ fontSize:11,color:'var(--text-4)',marginTop:1 }}>{formatTS(item.ts)}</div>
                </div>
                <div style={{ fontFamily:'Space Grotesk',fontWeight:700,color:'var(--expense)',fontSize:14 }}>−{formatVNDFull(item.amount)}</div>
                <button className="btn btn-xs" style={{ background:'var(--warning-light)',color:'var(--warning)',border:'1px solid var(--warning)' }} onClick={()=>setCatModal(item)}>{IC.tag(12)} Phân loại</button>
                <button className="icon-btn" style={{ width:28,height:28,color:'var(--expense)',flexShrink:0,border:'none' }} onClick={()=>setPending(p=>p.filter(x=>x.id!==item.id))}>{IC.trash(13)}</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter bar */}
      <div className="card" style={{ padding:'12px 14px' }}>
        <div className="filter-row">
          <div className="search-wrap" style={{ flex:1,minWidth:180 }}>
            {IC.search(15)}
            <input className="input" style={{ paddingLeft:34,height:38,fontSize:13 }} placeholder="Tìm theo tên, danh mục, ví..." value={search} onChange={e=>setSearch(e.target.value)} />
          </div>
          <div className="chip-group">
            <button className={'chip'+(groupFilter==='all'?' active-all':'')} onClick={()=>setGroupFilter('all')}>Tất cả</button>
            {personalCategoryGroups.map(g=>(
              <button key={g.key} className="chip"
                style={groupFilter===g.key?{background:g.color+'18',borderColor:g.color,color:g.color}:{}}
                onClick={()=>setGroupFilter(g.key)}>{g.name}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Transaction table */}
      <div className="card">
        <div style={{ padding:'12px 18px',borderBottom:'1px solid var(--border)',display:'flex',justifyContent:'space-between',alignItems:'center' }}>
          <span style={{ fontWeight:700,fontSize:13 }}>{filtered.length} giao dịch</span>
          <span style={{ fontFamily:'Space Grotesk',fontWeight:700,color:'var(--expense)',fontSize:14 }}>−{formatVNDFull(totalFiltered)}</span>
        </div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Ngày</th><th>Danh mục</th><th>Ví</th><th style={{ textAlign:'right' }}>Số tiền</th><th>Ghi chú</th><th style={{ textAlign:'center' }}>Thao tác</th></tr></thead>
            <tbody>
              {filtered.length===0 ? (
                <tr><td colSpan={6}><div className="empty-state">{IC.search(28)}<p>Không tìm thấy giao dịch</p></div></td></tr>
              ) : filtered.map(tx => {
                const cat = personalCategories.find(c=>c.id===tx.categoryId);
                const grp = personalCategoryGroups.find(g=>g.key===cat?.group);
                const wal = personalWallets.find(w=>w.id===tx.walletId);
                return (
                  <tr key={tx.id}>
                    <td style={{ fontSize:13,whiteSpace:'nowrap' }}>{formatDate(tx.date,true)}</td>
                    <td><div style={{ display:'flex',alignItems:'center',gap:7 }}>
                      <span style={{ width:8,height:8,borderRadius:'50%',background:cat?.color||'#94a3b8',flexShrink:0 }} />
                      <span style={{ fontSize:13 }}>{cat?.name||'—'}</span>
                      {grp && <span style={{ fontSize:10,background:grp.color+'18',color:grp.color,padding:'1px 7px',borderRadius:4,fontWeight:700 }}>{grp.name}</span>}
                    </div></td>
                    <td style={{ fontSize:12,color:'var(--text-3)' }}>{wal?.name||'—'}</td>
                    <td style={{ textAlign:'right',fontFamily:'Space Grotesk',fontWeight:700,fontSize:13,color:'var(--expense)' }}>−{formatVNDFull(tx.amount)}</td>
                    <td style={{ fontSize:12,color:'var(--text-3)',maxWidth:160,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{tx.note||'—'}</td>
                    <td>
                      <div style={{ display:'flex',gap:4,justifyContent:'center' }}>
                        <button className="icon-btn" style={{ width:30,height:30,color:'var(--primary)' }} onClick={()=>setEditingTx(tx)} title="Chỉnh sửa">{IC.edit(14)}</button>
                        <button className="icon-btn" style={{ width:30,height:30,color:'var(--expense)' }} onClick={()=>setDeletingTx(tx.id)} title="Xóa">{IC.trash(14)}</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filtered.length > 0 && (
          <div style={{ padding:'10px 16px',borderTop:'1px solid var(--border)',fontSize:12,color:'var(--text-4)' }}>Hiển thị {filtered.length} / {txList.length} giao dịch</div>
        )}
      </div>

      {catModal && <CategorizeModal item={catModal} onClose={()=>setCatModal(null)} onSave={categorizePending} personalCategories={personalCategories} personalCategoryGroups={personalCategoryGroups} personalWallets={personalWallets} />}
      {(addingNew||editingTx) && <PersonalTxModal editing={editingTx} onClose={()=>{setEditingTx(null);setAddingNew(false);}} onSave={saveTx} personalCategories={personalCategories} personalCategoryGroups={personalCategoryGroups} personalWallets={personalWallets} />}
      {deletingTx && (
        <div className="modal-bg" onClick={()=>setDeletingTx(null)}>
          <div className="modal-box" style={{ maxWidth:340 }} onClick={e=>e.stopPropagation()}>
            <div className="modal-header"><div className="modal-title">Xóa giao dịch?</div><button className="icon-btn" style={{ border:'none' }} onClick={()=>setDeletingTx(null)}>{IC.x(16)}</button></div>
            <div className="modal-body"><div style={{ fontSize:13,color:'var(--text-3)' }}>Hành động này không thể hoàn tác.</div></div>
            <div className="modal-footer">
              <button className="btn btn-ghost btn-sm" onClick={()=>setDeletingTx(null)}>Hủy</button>
              <button className="btn btn-sm" style={{ background:'var(--expense)',color:'white' }} onClick={()=>{setTxList(l=>l.filter(t=>t.id!==deletingTx));setDeletingTx(null);}}>{IC.trash(14)} Xóa</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── SAVINGS GOALS PAGE ──────────────────────────────────────────────────────── */
function SavingsGoals() {
  const [data, setData] = useState(null);
  const [goals, setGoals]   = useState([]);
  const [contrib, setContrib] = useState(null);
  const [editGoal, setEditGoal] = useState(null);
  const [showNew, setShowNew]   = useState(false);
  const [newGoal, setNewGoal]   = useState({ name:'', target:'', deadline:'', emoji:'🎯', color:'#7C3AED' });

  useEffect(() => {
    DataAdapter.getPersonalData().then(d => {
      setData(d);
      setGoals([...d.savingsGoals]);
    });
  }, []);

  if (!data) return <div style={{padding:20}}>Đang tải...</div>;

  const totalSaved  = goals.reduce((s,g)=>s+g.saved,0);
  const totalTarget = goals.reduce((s,g)=>s+g.target,0);

  function saveContrib(goalId, amount) {
    setGoals(gs=>gs.map(g=>g.id===goalId?{...g,saved:g.saved+amount}:g));
    setContrib(null);
  }
  function saveGoalEdit(id, form) {
    setGoals(gs=>gs.map(g=>g.id===id?{...g,...form}:g));
    setEditGoal(null);
  }
  function addGoal() {
    if (!newGoal.name||!newGoal.target) return;
    setGoals(gs=>[...gs,{id:'sg_'+Date.now(),name:newGoal.name,target:Number(newGoal.target),saved:0,deadline:newGoal.deadline||null,color:newGoal.color,emoji:newGoal.emoji}]);
    setShowNew(false); setNewGoal({name:'',target:'',deadline:'',emoji:'🎯',color:'#7C3AED'});
  }

  return (
    <div style={{ display:'flex',flexDirection:'column',gap:18 }}>
      <div style={{ display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:14 }}>
        {[
          { label:'Tổng đã tiết kiệm', value:totalSaved,  color:'var(--income)',  bg:'var(--income-light)',  icon:'arrowUp' },
          { label:'Tổng mục tiêu',     value:totalTarget, color:'#0D9488',        bg:'rgba(13,148,136,.1)', icon:'target'  },
          { label:'Cần thêm',          value:totalTarget-totalSaved, color:'var(--warning)', bg:'var(--warning-light)', icon:'alert' },
        ].map((s,i)=>(
          <div key={i} className="stat-card" style={{ padding:'16px 20px' }}>
            <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center' }}>
              <div><div className="stat-label">{s.label}</div>
                <div style={{ fontFamily:'Space Grotesk',fontWeight:700,fontSize:22,color:s.color,marginTop:5 }}>{formatVND(s.value)}</div>
              </div>
              <div className="stat-icon" style={{ background:s.bg,color:s.color }}>{IC[s.icon](22)}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display:'flex',justifyContent:'flex-end' }}>
        <button className="btn btn-sm" style={{ background:'#0D9488',color:'white' }} onClick={()=>setShowNew(true)}>{IC.plus(15)} Heo đất mới</button>
      </div>

      <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))',gap:16 }}>
        {goals.map(goal => {
          const pct = Math.min(goal.saved/goal.target*100,100);
          const rem = goal.target - goal.saved;
          const done = goal.saved >= goal.target;
          const daysLeft = goal.deadline ? Math.max(0,Math.round((new Date(goal.deadline)-new Date())/86400000)) : null;
          return (
            <div key={goal.id} className="card" style={{ padding:'22px',borderTop:`3px solid ${goal.color}`,position:'relative' }}>
              {/* Edit button */}
              <button className="icon-btn" style={{ position:'absolute',top:12,right:12,width:28,height:28,color:'var(--text-4)',border:'none',borderRadius:7 }}
                onClick={()=>setEditGoal(goal)} title="Chỉnh sửa">{IC.edit(13)}</button>
              <div style={{ marginBottom:14 }}>
                <div style={{ fontSize:26,marginBottom:6 }}>{goal.emoji}</div>
                <div style={{ fontFamily:'Space Grotesk',fontWeight:700,fontSize:16 }}>{goal.name}</div>
                <div style={{ display:'flex',gap:6,marginTop:5,flexWrap:'wrap' }}>
                  {done && <span className="badge badge-income">{IC.checkCircle(11)} Đạt mục tiêu!</span>}
                  {!done && daysLeft!==null && daysLeft<30 && <span className="badge badge-warning">{IC.clock(11)} {daysLeft} ngày</span>}
                </div>
              </div>
              <div style={{ marginBottom:12 }}>
                <div style={{ display:'flex',justifyContent:'space-between',fontSize:12,color:'var(--text-3)',marginBottom:6 }}>
                  <span>Tiến độ</span>
                  <span style={{ fontFamily:'Space Grotesk',fontWeight:700,color:goal.color }}>{pct.toFixed(0)}%</span>
                </div>
                <div className="progress-track" style={{ height:8 }}>
                  <div className="progress-fill" style={{ width:pct+'%',background:done?'var(--income)':goal.color,transition:'width .6s ease' }} />
                </div>
              </div>
              <div style={{ display:'flex',justifyContent:'space-between',fontSize:13,marginBottom:16 }}>
                <div><div style={{ fontSize:11,color:'var(--text-4)',marginBottom:2 }}>Đã tiết kiệm</div>
                  <div style={{ fontFamily:'Space Grotesk',fontWeight:700,color:goal.color,fontSize:16 }}>{formatVNDFull(goal.saved)}</div>
                </div>
                <div style={{ textAlign:'right' }}><div style={{ fontSize:11,color:'var(--text-4)',marginBottom:2 }}>Mục tiêu</div>
                  <div style={{ fontFamily:'Space Grotesk',fontWeight:600 }}>{formatVNDFull(goal.target)}</div>
                </div>
              </div>
              {!done && (
                <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center' }}>
                  <div style={{ fontSize:12,color:'var(--text-3)' }}>
                    Còn thiếu: <strong style={{ color:'var(--text)',fontFamily:'Space Grotesk' }}>{formatVND(rem)}</strong>
                    {goal.deadline && <span style={{ marginLeft:8,color:'var(--text-4)' }}>· Hạn {formatDate(goal.deadline)}</span>}
                  </div>
                  <button className="btn btn-xs" style={{ background:goal.color+'18',color:goal.color,border:'1px solid '+goal.color }} onClick={()=>setContrib(goal)}>{IC.plus(12)} Nạp</button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {contrib  && <ContributeModal goal={contrib} onClose={()=>setContrib(null)} onSave={saveContrib} />}
      {editGoal && <GoalEditModal goal={editGoal} onClose={()=>setEditGoal(null)} onSave={saveGoalEdit} />}

      {showNew && (
        <div className="modal-bg" onClick={()=>setShowNew(false)}>
          <div className="modal-box" style={{ maxWidth:420 }} onClick={e=>e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">Tạo heo đất mới</div>
              <button className="icon-btn" style={{ border:'none' }} onClick={()=>setShowNew(false)}>{IC.x(16)}</button>
            </div>
            <div className="modal-body" style={{ display:'flex',flexDirection:'column',gap:14 }}>
              <div style={{ display:'grid',gridTemplateColumns:'60px 1fr',gap:10 }}>
                <div className="input-group"><label className="input-label">Icon</label>
                  <input className="input" style={{ textAlign:'center',fontSize:20 }} value={newGoal.emoji} onChange={e=>setNewGoal(g=>({...g,emoji:e.target.value}))} maxLength={2} />
                </div>
                <div className="input-group"><label className="input-label">Tên mục tiêu *</label>
                  <input className="input" placeholder="VD: Mua laptop, Du lịch..." value={newGoal.name} onChange={e=>setNewGoal(g=>({...g,name:e.target.value}))} />
                </div>
              </div>
              <div className="input-group"><label className="input-label">Số tiền mục tiêu (VND) *</label>
                <input type="number" className="input" style={{ fontFamily:'Space Grotesk' }} placeholder="10000000" value={newGoal.target} onChange={e=>setNewGoal(g=>({...g,target:e.target.value}))} />
              </div>
              <div className="input-group"><label className="input-label">Hạn chót (tuỳ chọn)</label>
                <input type="date" className="input" value={newGoal.deadline} onChange={e=>setNewGoal(g=>({...g,deadline:e.target.value}))} />
              </div>
              <div className="input-group"><label className="input-label">Màu sắc</label>
                <div style={{ display:'flex',gap:8 }}>
                  {['#7C3AED','#0891B2','#059669','#D97706','#DC2626','#0D9488'].map(c=>(
                    <button key={c} onClick={()=>setNewGoal(g=>({...g,color:c}))}
                      style={{ width:30,height:30,borderRadius:'50%',background:c,border:newGoal.color===c?'3px solid var(--text-2)':'3px solid transparent',cursor:'pointer',padding:0 }} />
                  ))}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost btn-sm" onClick={()=>setShowNew(false)}>Hủy</button>
              <button className="btn btn-sm" disabled={!newGoal.name||!newGoal.target} style={{ background:newGoal.color,color:'white' }} onClick={addGoal}>{IC.piggy(14)} Tạo heo đất</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export {  MyWallet, DailySpend, SavingsGoals  };
