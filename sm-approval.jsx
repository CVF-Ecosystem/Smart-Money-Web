
const { useState, useMemo } = React;

// ── Action Modal (Approve / Reject) ───────────────────────────────────────────
function ActionModal({ req, mode, onClose, onConfirm }) {
  const [note, setNote] = useState('');
  const cat = getCatById(req.categoryId);
  const isApprove = mode === 'approve';

  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal-box" style={{ maxWidth: 440 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title" style={{ color: isApprove ? 'var(--income)' : 'var(--expense)' }}>
            {isApprove ? IC.checkCircle(17) : IC.x(17)}
            {' '}{isApprove ? 'Duyệt chi' : 'Từ chối đề xuất'}
          </div>
          <button className="icon-btn" style={{ border: 'none' }} onClick={onClose}>{IC.x(16)}</button>
        </div>
        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Summary card */}
          <div style={{ padding: '14px 16px', background: 'var(--surface-2)', borderRadius: 10, borderLeft: `3px solid ${isApprove ? 'var(--income)' : 'var(--expense)'}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{req.reqName}</div>
                <div style={{ fontSize: 12.5, color: 'var(--text-3)', marginTop: 3 }}>{req.desc}</div>
                <div style={{ fontSize: 12, color: 'var(--text-4)', marginTop: 5 }}>
                  {cat && <span style={{ background: cat.color + '18', color: cat.color, padding: '2px 8px', borderRadius: 4, fontWeight: 600, fontSize: 11 }}>{cat.code} · {cat.name}</span>}
                </div>
              </div>
              <div style={{ fontFamily: 'Space Grotesk', fontWeight: 800, fontSize: 18, color: 'var(--expense)', flexShrink: 0, marginLeft: 12 }}>
                {formatVNDFull(req.amount)}
              </div>
            </div>
          </div>

          {isApprove && (
            <div style={{ padding: '10px 12px', background: 'var(--income-light)', borderRadius: 8, fontSize: 12.5, color: 'var(--text-2)', display: 'flex', gap: 8 }}>
              <span style={{ color: 'var(--income)', flexShrink: 0 }}>{IC.info(14)}</span>
              Sau khi duyệt, <strong>{formatVNDFull(req.amount)}</strong> sẽ tự động trừ vào Quỹ chính và tạo bản ghi giao dịch chi.
            </div>
          )}

          <div className="input-group">
            <label className="input-label">{isApprove ? 'Ghi chú phê duyệt' : 'Lý do từ chối *'}</label>
            <textarea className="input" style={{ minHeight: 72 }}
              placeholder={isApprove ? 'VD: Đồng ý, đúng quy trình quỹ.' : 'VD: Chi phí không phù hợp, đề nghị xem lại...'}
              value={note} onChange={e => setNote(e.target.value)} />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost btn-sm" onClick={onClose}>Hủy</button>
          <button className="btn btn-sm"
            disabled={!isApprove && !note.trim()}
            style={{ background: isApprove ? 'var(--income)' : 'var(--expense)', color: 'white' }}
            onClick={() => onConfirm(req.id, mode, note)}>
            {isApprove ? IC.check(14) : IC.x(14)}
            {isApprove ? ' Xác nhận duyệt' : ' Xác nhận từ chối'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Approval Card ─────────────────────────────────────────────────────────────
function ApprovalCard({ req, onAction }) {
  const cat = getCatById(req.categoryId);
  const statusMap = {
    pending:  { cls: 'badge-warning',  label: 'Chờ duyệt', color: 'var(--warning)' },
    approved: { cls: 'badge-income',   label: 'Đã duyệt',  color: 'var(--income)'  },
    rejected: { cls: 'badge-expense',  label: 'Từ chối',   color: 'var(--expense)' },
  };
  const s = statusMap[req.status] || statusMap.pending;

  return (
    <div className="card" style={{ padding: '18px 20px', borderLeft: `3px solid ${s.color}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>{req.reqName}</div>
            <span className={'badge ' + s.cls}>{s.label}</span>
            {req.attach && (
              <span style={{ fontSize: 11, color: 'var(--text-4)', display: 'flex', alignItems: 'center', gap: 3 }}>
                {IC.paperclip(11)} {req.attach}
              </span>
            )}
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 8, lineHeight: 1.5 }}>{req.desc}</div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            {cat && <span style={{ background: cat.color + '18', color: cat.color, padding: '2px 9px', borderRadius: 4, fontSize: 11, fontWeight: 700 }}>{cat.code} · {cat.name}</span>}
            <span style={{ fontSize: 12, color: 'var(--text-4)' }}>Ngày đề xuất: {formatDate(req.reqDate)}</span>
            {req.approvedDate && <span style={{ fontSize: 12, color: 'var(--text-4)' }}>Duyệt: {formatDate(req.approvedDate)} · {req.approver}</span>}
          </div>
          {req.note && req.status === 'approved' && (
            <div style={{ marginTop: 8, fontSize: 12, color: 'var(--income)', fontStyle: 'italic' }}>"{req.note}"</div>
          )}
          {req.note && req.status === 'rejected' && (
            <div style={{ marginTop: 8, fontSize: 12, color: 'var(--expense)', fontStyle: 'italic' }}>Lý do: "{req.note}"</div>
          )}
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontFamily: 'Space Grotesk', fontWeight: 800, fontSize: 20, color: 'var(--expense)', marginBottom: 10 }}>
            {formatVNDFull(req.amount)}
          </div>
          {req.status === 'pending' && (
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button className="btn btn-xs" style={{ background: 'var(--income-light)', color: 'var(--income)', border: '1px solid var(--income)' }}
                onClick={() => onAction(req, 'approve')}>
                {IC.check(13)} Duyệt
              </button>
              <button className="btn btn-xs" style={{ background: 'var(--expense-light)', color: 'var(--expense)', border: '1px solid var(--expense)' }}
                onClick={() => onAction(req, 'reject')}>
                {IC.x(13)} Từ chối
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── APPROVALS PAGE ────────────────────────────────────────────────────────────
function Approvals() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab]           = useState('pending');
  const [modal, setModal]       = useState(null); // { req, mode }

  useEffect(() => {
    loadApprovals();
  }, []);

  async function loadApprovals() {
    try {
      setLoading(true);
      // NOTE: approval_requests table not yet in Supabase schema.
      // When table is added, replace this with: DataAdapter.getApprovalRequests()
      // For now, use MOCK_DATA so the page renders meaningfully
      setRequests([...MOCK_DATA.approvalRequests]);
    } catch (error) {
      console.error('Failed to load approvals:', error);
      setRequests([]); // empty on error — do NOT silently use stale MOCK_DATA
    } finally {
      setLoading(false);
    }
  }

  const pending  = requests.filter(r => r.status === 'pending');
  const approved = requests.filter(r => r.status === 'approved');
  const rejected = requests.filter(r => r.status === 'rejected');

  const totalPending  = pending.reduce((s, r)  => s + r.amount, 0);
  const totalApproved = approved.reduce((s, r) => s + r.amount, 0);

  function handleAction(id, mode, note) {
    const approverName = (MOCK_DATA.user || {}).name || 'Admin';
    setRequests(rs => rs.map(r => {
      if (r.id !== id) return r;
      return mode === 'approve'
        ? { ...r, status: 'approved', note, approvedDate: new Date().toISOString().split('T')[0], approver: approverName }
        : { ...r, status: 'rejected', note };
    }));
    setModal(null);
    if (mode === 'approve') setTab('approved'); else setTab('rejected');
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
        <div style={{ textAlign: 'center', color: 'var(--text-3)' }}>
          <div style={{ fontSize: 14 }}>Đang tải phê duyệt...</div>
        </div>
      </div>
    );
  }

  const tabItems = [
    { id: 'pending',  label: `Chờ duyệt (${pending.length})` },
    { id: 'approved', label: `Đã duyệt (${approved.length})` },
    { id: 'rejected', label: `Từ chối (${rejected.length})` },
  ];

  const shown = tab === 'pending' ? pending : tab === 'approved' ? approved : rejected;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14 }}>
        {[
          { label: 'Chờ phê duyệt', value: pending.length,    sub: formatVND(totalPending),  color: 'var(--warning)',  bg: 'var(--warning-light)',  icon: 'clock' },
          { label: 'Đã duyệt T5',   value: approved.length,   sub: formatVND(totalApproved), color: 'var(--income)',   bg: 'var(--income-light)',   icon: 'checkCircle' },
          { label: 'Từ chối T5',    value: rejected.length,   sub: 'Không giải ngân',        color: 'var(--expense)',  bg: 'var(--expense-light)',  icon: 'x' },
        ].map((s, i) => (
          <div key={i} className="stat-card" style={{ padding: '16px 20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div className="stat-label">{s.label}</div>
                <div style={{ fontFamily: 'Space Grotesk', fontWeight: 800, fontSize: 28, color: s.color, marginTop: 4 }}>{s.value}</div>
                <div style={{ fontSize: 12, color: 'var(--text-4)', marginTop: 2 }}>{s.sub}</div>
              </div>
              <div className="stat-icon" style={{ background: s.bg, color: s.color }}>{IC[s.icon](22)}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Tab bar */}
      <div className="card" style={{ padding: '6px', display: 'flex', gap: 4 }}>
        {tabItems.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{ flex: 1, padding: '9px 12px', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 13, fontFamily: 'inherit', transition: 'all .15s', display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: tab === t.id ? 'var(--primary)' : 'transparent',
              color:      tab === t.id ? 'white' : 'var(--text-3)',
            }}>{t.label}
          </button>
        ))}
      </div>

      {/* Request list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {shown.length === 0 ? (
          <div className="empty-state card" style={{ padding: '40px 0' }}>
            {IC.checkCircle(36)}
            <p>Không có đề xuất nào trong mục này</p>
          </div>
        ) : shown.map(req => (
          <ApprovalCard key={req.id} req={req} onAction={(r, mode) => setModal({ req: r, mode })} />
        ))}
      </div>

      {modal && (
        <ActionModal req={modal.req} mode={modal.mode}
          onClose={() => setModal(null)}
          onConfirm={handleAction} />
      )}
    </div>
  );
}

// ── AUDIT LOG PAGE ────────────────────────────────────────────────────────────
const AUDIT_CFG = {
  create:  { color: 'var(--income)',   bg: 'var(--income-light)',   icon: 'plus',         label: 'Tạo mới'   },
  edit:    { color: 'var(--primary)',  bg: 'var(--primary-light)',  icon: 'edit',         label: 'Chỉnh sửa' },
  delete:  { color: 'var(--expense)',  bg: 'var(--expense-light)',  icon: 'trash',        label: 'Xóa'       },
  approve: { color: '#0D9488',         bg: 'rgba(13,148,136,0.1)', icon: 'checkCircle',  label: 'Duyệt'     },
  reject:  { color: 'var(--warning)',  bg: 'var(--warning-light)',  icon: 'x',            label: 'Từ chối'   },
};

function AuditLog() {
  const [auditLog, setAuditLog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadAuditLog();
  }, []);

  async function loadAuditLog() {
    try {
      setLoading(true);
      const data = await DataAdapter.getAuditLog(50); // Last 50 entries
      setAuditLog(data);
    } catch (error) {
      console.error('Failed to load audit log:', error);
      // Show empty list on error — do not silently fall back to stale MOCK_DATA
      setAuditLog([]);
    } finally {
      setLoading(false);
    }
  }

  const filtered = useMemo(() => auditLog.filter(e => {
    if (filter !== 'all' && e.action !== filter) return false;
    if (search) {
      const q = search.toLowerCase();
      return e.desc.toLowerCase().includes(q) || e.entity.toLowerCase().includes(q) || e.user.toLowerCase().includes(q);
    }
    return true;
  }), [auditLog, filter, search]);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
        <div style={{ textAlign: 'center', color: 'var(--text-3)' }}>
          <div style={{ fontSize: 14 }}>Đang tải lịch sử...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Filter bar */}
      <div className="card" style={{ padding: '12px 14px' }}>
        <div className="filter-row">
          <div className="search-wrap" style={{ flex: 1 }}>
            {IC.search(15)}
            <input className="input" style={{ paddingLeft: 34, height: 38, fontSize: 13 }}
              placeholder="Tìm trong lịch sử..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="chip-group">
            <button className={'chip' + (filter === 'all' ? ' active-all' : '')} onClick={() => setFilter('all')}>Tất cả</button>
            {Object.entries(AUDIT_CFG).map(([k, cfg]) => (
              <button key={k}
                className="chip"
                style={filter === k ? { background: cfg.bg, borderColor: cfg.color, color: cfg.color } : {}}
                onClick={() => setFilter(k)}>{cfg.label}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="card">
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)' }}>
          <div className="section-title" style={{ marginBottom: 0 }}>Lịch sử thao tác hệ thống</div>
        </div>
        <div style={{ padding: '8px 0' }}>
          {filtered.length === 0 ? (
            <div className="empty-state">{IC.search(28)}<p>Không tìm thấy mục nào</p></div>
          ) : filtered.map((e, i) => {
            const cfg = AUDIT_CFG[e.action] || AUDIT_CFG.edit;
            return (
              <div key={e.id} style={{ display: 'flex', gap: 14, padding: '12px 20px', borderBottom: i < filtered.length - 1 ? '1px solid var(--border)' : 'none', alignItems: 'flex-start' }}>
                {/* Icon */}
                <div style={{ width: 34, height: 34, borderRadius: 10, background: cfg.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: cfg.color, flexShrink: 0, marginTop: 2 }}>
                  {IC[cfg.icon] ? IC[cfg.icon](16) : IC.info(16)}
                </div>
                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3, flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--text)' }}>{e.desc}</span>
                    <span style={{ fontSize: 10, background: cfg.bg, color: cfg.color, padding: '1px 8px', borderRadius: 4, fontWeight: 800, letterSpacing: '.4px' }}>{cfg.label}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 12, fontSize: 11.5, color: 'var(--text-4)', flexWrap: 'wrap' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>{IC.folder(11)} {e.entity}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>{IC.users(11)} {e.user}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>{IC.clock(11)} {formatTS(e.ts)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div style={{ padding: '10px 20px', borderTop: '1px solid var(--border)', fontSize: 12, color: 'var(--text-4)' }}>
          {filtered.length} / {auditLog.length} mục · Dữ liệu được bảo lưu theo RLS Supabase
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { Approvals, AuditLog });
