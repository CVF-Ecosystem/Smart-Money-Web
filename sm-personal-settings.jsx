
const { useState } = React;

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
            {/* Preview */}
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
// NOTE: Personal finance tables not yet in Supabase schema.
// Using MOCK_DATA as initial seed; React state is the source of truth in-session.
// TODO: Migrate to DataAdapter when personal_wallets / personal_budgets tables are created.
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

  function saveSalary() {
    // State-only save — no Supabase table yet for personal salary info
    // TODO: replace with DataAdapter.updateSalaryInfo({ monthlySalary: salary, salaryDay })
    setSalarySaved(true);
    setTimeout(() => setSalarySaved(false), 2000);
  }

  function saveBudgets() {
    // State-only save — no Supabase table yet for personal budgets
    // TODO: replace with DataAdapter.updatePersonalBudgets({ monthly: totalBudget, categories: budgets })
    setBudgetSaved(true);
    setTimeout(() => setBudgetSaved(false), 2000);
  }

  function handleCatSave(form) {
    // State-only update — no Supabase table yet for personal categories
    // TODO: replace with DataAdapter.updatePersonalCategory / addPersonalCategory
    if (catModal && catModal.id) {
      setCats(cs => cs.map(c => c.id === catModal.id ? {...c, ...form} : c));
    } else {
      const newCat = { id: 'pc_' + Date.now(), ...form };
      setCats(cs => [...cs, newCat]);
    }
    setCatModal(null);
  }

  function handleCatDelete(id) {
    // State-only delete — no Supabase table yet for personal categories
    // TODO: replace with DataAdapter.deletePersonalCategory(id)
    setCats(cs => cs.filter(c => c.id !== id));
    setDeletingId(null);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 740 }}>

      {/* ── Salary ──────────────────────────────────────────────────────── */}
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

        {/* Quick stats */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 18, flexWrap: 'wrap' }}>
          {[
            ['Lương / ngày', formatVND(salary / 30), '#0D9488'],
            ['Sau chi cố định', formatVND(Math.max(0, salary - budgets.fixed)), 'var(--primary)'],
            ['Ngân sách / ngày', formatVND(totalBudget / 30), 'var(--warning)'],
          ].map(([lbl, val, clr]) => (
            <div key={lbl} style={{ padding: '10px 16px', background: 'var(--surface-2)', borderRadius: 9, border: '1px solid var(--border)', flex: 1, minWidth: 140 }}>
              <div style={{ fontSize: 11, color: 'var(--text-4)', marginBottom: 3 }}>{lbl}</div>
              <div style={{ fontFamily: 'Space Grotesk', fontWeight: 700, color: clr, fontSize: 15 }}>{val}</div>
            </div>
          ))}
        </div>

        <button className="btn btn-sm" style={{ background: salarySaved ? 'var(--income)' : '#0D9488', color: 'white', transition: 'background .3s' }} onClick={saveSalary}>
          {salarySaved ? <>{IC.checkCircle(14)} Đã lưu!</> : <>{IC.check(14)} Lưu thu nhập</>}
        </button>
      </div>

      {/* ── Monthly Budget ───────────────────────────────────────────────── */}
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
            const val  = budgets[grp.key] || 0;
            const pct  = totalBudget ? Math.min(val / totalBudget * 100, 100) : 0;
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
            {IC.alert(15)} Tổng phân bổ ({formatVND(budgetAllocated)}) vượt tổng ngân sách. Vui lòng điều chỉnh.
          </div>
        )}

        <button className="btn btn-sm" style={{ background: budgetSaved ? 'var(--income)' : '#0D9488', color: 'white', transition: 'background .3s' }} onClick={saveBudgets}>
          {budgetSaved ? <>{IC.checkCircle(14)} Đã lưu!</> : <>{IC.check(14)} Lưu ngân sách</>}
        </button>
      </div>

      {/* ── Personal Categories Manager ──────────────────────────────────── */}
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
              {/* Group header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, paddingBottom: 8, borderBottom: `2px solid ${grp.color}22` }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: grp.color }} />
                <span style={{ fontWeight: 700, fontSize: 13.5, color: grp.color }}>{grp.name}</span>
                <span style={{ fontSize: 12, color: 'var(--text-4)' }}>— {grp.desc}</span>
                <span style={{ marginLeft: 'auto', fontSize: 11.5, background: grp.color+'18', color: grp.color, padding: '2px 9px', borderRadius: 10, fontWeight: 700 }}>
                  {grpCats.length} danh mục
                </span>
              </div>

              {/* Category chips */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {grpCats.map(cat => (
                  <div key={cat.id} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '7px 12px', borderRadius: 8, background: 'var(--surface-2)', border: '1px solid var(--border)', transition: 'box-shadow .15s' }}>
                    <span style={{ width: 9, height: 9, borderRadius: '50%', background: cat.color, flexShrink: 0 }} />
                    <span style={{ fontSize: 13, fontWeight: 500 }}>{cat.name}</span>
                    <button className="icon-btn" style={{ width: 24, height: 24, border: 'none', color: 'var(--primary)', borderRadius: 5, flexShrink: 0 }}
                      onClick={() => setCatModal(cat)} title="Sửa">{IC.edit(11)}</button>
                    <button className="icon-btn" style={{ width: 24, height: 24, border: 'none', color: 'var(--expense)', borderRadius: 5, flexShrink: 0 }}
                      onClick={() => setDeletingId(cat.id)} title="Xóa">{IC.trash(11)}</button>
                  </div>
                ))}

                {/* Add to this group shortcut */}
                <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px', borderRadius: 8, border: `1.5px dashed ${grp.color}66`, background: 'transparent', color: grp.color, cursor: 'pointer', fontSize: 12.5, fontWeight: 600, fontFamily: 'inherit', transition: 'all .15s' }}
                  onClick={() => setCatModal({ mode: 'new', group: grp.key })}>
                  {IC.plus(13)} Thêm vào {grp.name}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Category add/edit modal */}
      {catModal && (
        <PCatModal
          cat={catModal.mode === 'new' || catModal.id === undefined ? null : catModal}
          defaultGroup={catModal.group || 'daily'}
          groups={groups}
          onClose={() => setCatModal(null)}
          onSave={handleCatSave}
        />
      )}

      {/* Delete confirm */}
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

Object.assign(window, { PersonalSettings });
