
const { useState, useMemo, useEffect } = React;

// ── Mini SVG Bar Chart ────────────────────────────────────────────────────────
function BarChart({ data }) {
  const max = Math.max(...data.map(d => Math.max(d.income, d.expense)), 1);
  const H = 150, W = 540, cols = data.length;
  const colW = W / cols;
  const bw = Math.min(14, colW * 0.28);

  return (
    <svg viewBox={`0 0 ${W} ${H + 28}`} preserveAspectRatio="none" style={{ width: '100%', height: '190px', display: 'block' }}>
      {/* Grid lines */}
      {[0.25, 0.5, 0.75, 1].map(f => (
        <line key={f} x1={0} y1={H - H * f} x2={W} y2={H - H * f}
          stroke="var(--border)" strokeWidth="0.5" strokeDasharray="3,4" />
      ))}
      {data.map((d, i) => {
        const cx = i * colW + colW / 2;
        const ih = (d.income / max) * H;
        const eh = (d.expense / max) * H;
        const hasData = d.income > 0 || d.expense > 0;
        return (
          <g key={d.month}>
            {/* Income bar */}
            <rect x={cx - bw - 1} y={H - ih} width={bw} height={Math.max(ih, 0)} rx="2.5"
              fill={hasData ? 'var(--income)' : 'var(--border)'} opacity={hasData ? 0.85 : 0.3} />
            {/* Expense bar */}
            <rect x={cx + 1} y={H - eh} width={bw} height={Math.max(eh, 0)} rx="2.5"
              fill={hasData ? 'var(--expense)' : 'var(--border)'} opacity={hasData ? 0.75 : 0.3} />
            {/* Month label */}
            <text x={cx} y={H + 18} textAnchor="middle" fontSize="10" fill="var(--text-3)" fontFamily="Inter, sans-serif">
              {d.month}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ── Spending Donut ────────────────────────────────────────────────────────────
function SpendDonut({ transactions, categories }) {
  const expCats = categories.filter(c => c.type === 'expense');
  const totals = expCats.map(cat => ({
    ...cat,
    total: transactions.filter(t => t.type === 'expense' && t.categoryId === cat.id).reduce((s, t) => s + t.amount, 0),
  })).filter(c => c.total > 0).sort((a, b) => b.total - a.total).slice(0, 5);

  const grandTotal = totals.reduce((s, c) => s + c.total, 0);
  if (!grandTotal) return <div className="empty-state" style={{ padding: '20px 0' }}><p style={{ fontSize: 13 }}>Chưa có dữ liệu chi tiêu</p></div>;

  // Simple SVG donut
  const R = 52, r = 34, cx = 70, cy = 70;
  let startAngle = -Math.PI / 2;
  const arcs = totals.map(cat => {
    const angle = (cat.total / grandTotal) * 2 * Math.PI;
    const x1 = cx + R * Math.cos(startAngle);
    const y1 = cy + R * Math.sin(startAngle);
    startAngle += angle;
    const x2 = cx + R * Math.cos(startAngle);
    const y2 = cy + R * Math.sin(startAngle);
    const xi1 = cx + r * Math.cos(startAngle);
    const yi1 = cy + r * Math.sin(startAngle);
    const xi2 = cx + r * Math.cos(startAngle - angle);
    const yi2 = cy + r * Math.sin(startAngle - angle);
    const large = angle > Math.PI ? 1 : 0;
    const d = `M ${x1} ${y1} A ${R} ${R} 0 ${large} 1 ${x2} ${y2} L ${xi1} ${yi1} A ${r} ${r} 0 ${large} 0 ${xi2} ${yi2} Z`;
    return { ...cat, d };
  });

  return (
    <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
      <svg width={140} height={140} viewBox="0 0 140 140" style={{ flexShrink: 0 }}>
        {arcs.map((a, i) => (
          <path key={i} d={a.d} fill={a.color} opacity={0.9} />
        ))}
        <circle cx={cx} cy={cy} r={28} fill="var(--surface)" />
        <text x={cx} y={cy - 5} textAnchor="middle" fontSize="10" fill="var(--text-3)" fontFamily="Inter">Tổng chi</text>
        <text x={cx} y={cy + 10} textAnchor="middle" fontSize="11" fontWeight="700" fill="var(--text)" fontFamily="Space Grotesk, sans-serif">
          {formatVND(grandTotal)}
        </text>
      </svg>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 7 }}>
        {totals.map((cat, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: cat.color, flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: 'var(--text-2)', flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{cat.name}</span>
            <span style={{ fontSize: 12, fontFamily: 'Space Grotesk', fontWeight: 600, color: 'var(--text)', flexShrink: 0 }}>{formatVND(cat.total)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Personal Finance Widget ───────────────────────────────────────────────────
// NOTE: Personal finance tables (personal_wallets, personal_transactions, personal_budgets)
// are not yet in Supabase schema — using MOCK_DATA intentionally until schema is extended.
// TODO: Migrate when personal_wallets + personal_transactions tables are created.
function PersonalWidget({ setPage }) {
  const { personalTransactions, personalCategories, personalCategoryGroups, personalBudgets, personalWallets, salaryInfo } = MOCK_DATA;
  const mp = new Date().toISOString().slice(0, 7);
  const fixedIds   = new Set(personalCategories.filter(c=>c.group==='fixed').map(c=>c.id));
  const fixedSpent = personalTransactions.filter(t=>t.date.startsWith(mp)&&fixedIds.has(t.categoryId)).reduce((s,t)=>s+t.amount,0);
  const dailyAllow = Math.max(0,(salaryInfo.monthlySalary-fixedSpent)/20);
  const spentToday = personalTransactions.filter(t=>t.date===new Date().toISOString().split('T')[0]).reduce((s,t)=>s+t.amount,0);
  const overToday  = spentToday > dailyAllow;
  const totalMonth = personalTransactions.filter(t=>t.date.startsWith(mp)).reduce((s,t)=>s+t.amount,0);
  const monthPct   = Math.min(totalMonth/personalBudgets.monthly*100,100);
  const monthColor = totalMonth>personalBudgets.monthly?'var(--expense)':totalMonth/personalBudgets.monthly>0.8?'var(--warning)':'var(--income)';
  const totalBal   = personalWallets.reduce((s,w)=>s+w.balance,0);
  const spendByGroup = {};
  personalTransactions.forEach(tx => {
    if (!tx.date.startsWith(mp)) return;
    const cat = personalCategories.find(c=>c.id===tx.categoryId);
    if (cat) spendByGroup[cat.group] = (spendByGroup[cat.group]||0) + tx.amount;
  });

  return (
    <div className="card" style={{ padding:'20px 24px', borderLeft:'4px solid #0D9488' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:34,height:34,borderRadius:9,background:'rgba(13,148,136,0.12)',display:'flex',alignItems:'center',justifyContent:'center',color:'#0D9488' }}>{IC.creditCard(17)}</div>
          <div>
            <div style={{ fontFamily:'Space Grotesk',fontWeight:700,fontSize:14 }}>Tài chính cá nhân · T{new Date().getMonth() + 1}/{new Date().getFullYear()}</div>
            <div style={{ fontSize:11.5,color:'var(--text-4)' }}>{(MOCK_DATA.user||{}).name || 'Thuủ quỹ'}</div>
          </div>
        </div>
        <button className="btn btn-ghost btn-xs" style={{ borderColor:'#0D9488',color:'#0D9488' }} onClick={()=>setPage('my-wallet')}>Xem chi tiết →</button>
      </div>

      {/* 3 stat boxes */}
      <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:12,marginBottom:14 }}>
        <div style={{ padding:'14px 16px',borderRadius:10,background:overToday?'var(--expense-light)':'rgba(13,148,136,0.07)',border:`1px solid ${overToday?'var(--expense)':'rgba(13,148,136,0.22)'}` }}>
          <div style={{ fontSize:10.5,color:'var(--text-4)',fontWeight:700,letterSpacing:'.5px',marginBottom:5 }}>NGÂN SÁCH HÔM NAY</div>
          <div style={{ fontFamily:'Space Grotesk',fontWeight:800,fontSize:20,color:overToday?'var(--expense)':'#0D9488',letterSpacing:'-.5px' }}>{formatVND(dailyAllow)}</div>
          <div style={{ marginTop:6,fontSize:12,color:'var(--text-3)' }}>Đã chi: <strong style={{ fontFamily:'Space Grotesk',color:overToday?'var(--expense)':'var(--text)' }}>{formatVND(spentToday)}</strong></div>
          {overToday && <div style={{ fontSize:11,color:'var(--expense)',marginTop:3,fontWeight:700 }}>⚠ Vượt hạn mức!</div>}
        </div>
        <div style={{ padding:'14px 16px',borderRadius:10,background:'var(--surface-2)',border:'1px solid var(--border)' }}>
          <div style={{ fontSize:10.5,color:'var(--text-4)',fontWeight:700,letterSpacing:'.5px',marginBottom:5 }}>CHI TIÊU THÁNG NÀY</div>
          <div style={{ fontFamily:'Space Grotesk',fontWeight:800,fontSize:20,color:'var(--expense)',letterSpacing:'-.5px' }}>{formatVND(totalMonth)}</div>
          <div style={{ fontSize:12,color:'var(--text-3)',margin:'5px 0 7px' }}>NS: {formatVND(personalBudgets.monthly)} · {monthPct.toFixed(0)}%</div>
          <div className="progress-track" style={{ height:5 }}><div className="progress-fill" style={{ width:monthPct+'%',background:monthColor }} /></div>
        </div>
        <div style={{ padding:'14px 16px',borderRadius:10,background:'var(--surface-2)',border:'1px solid var(--border)' }}>
          <div style={{ fontSize:10.5,color:'var(--text-4)',fontWeight:700,letterSpacing:'.5px',marginBottom:5 }}>TÀI SẢN RÒNG</div>
          <div style={{ fontFamily:'Space Grotesk',fontWeight:800,fontSize:20,color:totalBal>=0?'var(--income)':'var(--expense)',letterSpacing:'-.5px' }}>{formatVND(totalBal)}</div>
          <div style={{ marginTop:8,display:'flex',flexDirection:'column',gap:4 }}>
            {personalWallets.map(w=>(
              <div key={w.id} style={{ display:'flex',justifyContent:'space-between',fontSize:11.5 }}>
                <span style={{ color:'var(--text-3)',display:'flex',alignItems:'center',gap:5 }}><span style={{ width:6,height:6,borderRadius:'50%',background:w.color,display:'inline-block',flexShrink:0 }} />{w.name}</span>
                <span style={{ fontFamily:'Space Grotesk',fontWeight:600,color:w.balance<0?'var(--expense)':'var(--text)' }}>{formatVND(w.balance)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Budget group mini-bars */}
      <div style={{ display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10 }}>
        {personalCategoryGroups.map(grp=>{
          const spent=spendByGroup[grp.key]||0, budget=personalBudgets.categories[grp.key]||0;
          const pct=budget?Math.min(spent/budget*100,100):0, over=spent>budget;
          return (
            <div key={grp.key} style={{ cursor:'pointer' }} onClick={()=>setPage('daily-spend')}>
              <div style={{ display:'flex',justifyContent:'space-between',fontSize:11,marginBottom:5 }}>
                <span style={{ fontWeight:700,color:grp.color }}>{grp.name}</span>
                <span style={{ color:over?'var(--expense)':'var(--text-4)',fontWeight:over?700:400 }}>{pct.toFixed(0)}%</span>
              </div>
              <div className="progress-track" style={{ height:5 }}>
                <div className="progress-fill" style={{ width:pct+'%',background:over?'var(--expense)':pct>80?'var(--warning)':grp.color,transition:'width .5s' }} />
              </div>
              <div style={{ fontSize:10.5,color:'var(--text-4)',marginTop:3 }}>{formatVND(spent)} / {formatVND(budget)}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Dashboard ────────────────────────────────────────────────────────────────
function Dashboard() {
  const { setPage, setShowAddTx } = useApp();
  const [stats, setStats] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [monthlyChart, setMonthlyChart] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const [txData, catData] = await Promise.all([
        DataAdapter.getTransactions(),
        DataAdapter.getCategories(),
      ]);
      
      setTransactions(txData);
      setCategories(catData);
      
      // Calculate stats
      const allIncome = txData.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
      const allExpense = txData.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
      const fundAccounts = await DataAdapter.getFundAccounts();
      const initialBalance = fundAccounts[0]?.initial_balance || MOCK_DATA.fundAccount.initialBalance;
      
      setStats({
        balance: initialBalance + allIncome - allExpense,
        totalIncome: allIncome,
        totalExpense: allExpense,
        openingBalance: initialBalance,
      });
      
      // Calculate monthly chart from actual transactions
      const monthlyData = [];
      const months = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'];
      for (let i = 0; i < 12; i++) {
        const monthPrefix = `${new Date().getFullYear()}-${String(i + 1).padStart(2, '0')}`;
        const income = txData.filter(t => t.type === 'income' && t.date.startsWith(monthPrefix)).reduce((s, t) => s + t.amount, 0);
        const expense = txData.filter(t => t.type === 'expense' && t.date.startsWith(monthPrefix)).reduce((s, t) => s + t.amount, 0);
        monthlyData.push({ month: months[i], income, expense });
      }
      setMonthlyChart(monthlyData);
      
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      Toast.error('Không thể ');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
        <div style={{ textAlign: 'center', color: 'var(--text-3)' }}>
          <div style={{ fontSize: 14, marginBottom: 8 }}>Đang tải dashboard...</div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return <div className="empty-state"><p>Không thể tải dữ liệu</p></div>;
  }

  const recent = transactions.slice(0, 7);
  const monthPrefix = new Date().toISOString().slice(0, 7);
  const mIncome = transactions.filter(t => t.type === 'income' && t.date.startsWith(monthPrefix)).reduce((s, t) => s + t.amount, 0);
  const mExpense = transactions.filter(t => t.type === 'expense' && t.date.startsWith(monthPrefix)).reduce((s, t) => s + t.amount, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Balance hero card */}
      <div style={{
        background: 'linear-gradient(135deg, #1e3a5f 0%, #2563EB 60%, #3b82f6 100%)',
        borderRadius: 16, padding: '28px 32px', color: 'white', position: 'relative', overflow: 'hidden',
      }}>
        {/* Decorative circles */}
        <div style={{ position: 'absolute', right: -40, top: -40, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
        <div style={{ position: 'absolute', right: 60, bottom: -60, width: 160, height: 160, borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative' }}>
          <div>
            <div style={{ fontSize: 13, opacity: 0.75, fontWeight: 500, marginBottom: 8 }}>Số dư hiện tại · Quỹ chính</div>
            <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 38, fontWeight: 700, letterSpacing: '-1px', lineHeight: 1.1 }}>
              {formatVNDFull(stats.balance)}
            </div>
            <div style={{ marginTop: 12, display: 'flex', gap: 20 }}>
              <div>
                <div style={{ fontSize: 11, opacity: 0.6, marginBottom: 2 }}>Số dư đầu kỳ</div>
                <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 15, fontWeight: 600 }}>{formatVND(stats.openingBalance)}</div>
              </div>
              <div style={{ width: 1, background: 'rgba(255,255,255,0.2)' }} />
              <div>
                <div style={{ fontSize: 11, opacity: 0.6, marginBottom: 2 }}>Tổng thu vào</div>
                <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 15, fontWeight: 600 }}>{formatVND(stats.totalIncome)}</div>
              </div>
              <div style={{ width: 1, background: 'rgba(255,255,255,0.2)' }} />
              <div>
                <div style={{ fontSize: 11, opacity: 0.6, marginBottom: 2 }}>Tổng chi ra</div>
                <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 15, fontWeight: 600 }}>{formatVND(stats.totalExpense)}</div>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn" style={{ background: 'rgba(255,255,255,0.15)', color: 'white', backdropFilter: 'blur(4px)', border: '1px solid rgba(255,255,255,0.2)', fontSize: 13 }}
              onClick={() => { setShowAddTx(true); }}>
              {IC.plus(15)} Thêm
            </button>
            <button className="btn" style={{ background: 'rgba(255,255,255,0.15)', color: 'white', backdropFilter: 'blur(4px)', border: '1px solid rgba(255,255,255,0.2)', fontSize: 13 }}
              onClick={() => setPage('reports')}>
              {IC.chart(15)} Báo cáo
            </button>
          </div>
        </div>
      </div>

      {/* Month stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
        {[
          { label: 'Thu tháng này', value: mIncome, color: 'var(--income)', bg: 'var(--income-light)', icon: 'arrowUp' },
          { label: 'Chi tháng này', value: mExpense, color: 'var(--expense)', bg: 'var(--expense-light)', icon: 'arrowDown' },
          { label: 'Chênh lệch T5', value: mIncome - mExpense, color: mIncome >= mExpense ? 'var(--income)' : 'var(--expense)', bg: mIncome >= mExpense ? 'var(--income-light)' : 'var(--expense-light)', icon: mIncome >= mExpense ? 'trendUp' : 'trendDown' },
        ].map((s, i) => (
          <div key={i} className="stat-card" style={{ padding: '18px 20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div className="stat-label">{s.label}</div>
                <div className="stat-value" style={{ color: s.color, fontSize: 22, marginTop: 6 }}>{formatVND(s.value)}</div>
              </div>
              <div className="stat-icon" style={{ background: s.bg, color: s.color }}>{IC[s.icon](20)}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Personal finance widget */}
      <PersonalWidget setPage={setPage} />

      {/* Chart + Recent Transactions */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 16 }}>

        {/* Monthly chart */}
        <div className="card" style={{ padding: '20px 24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div className="section-title" style={{ marginBottom: 0 }}>Xu hướng thu chi {new Date().getFullYear()}</div>
            <div style={{ display: 'flex', gap: 14, fontSize: 12, color: 'var(--text-3)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><span className="dot" style={{ background: 'var(--income)' }} /> Thu vào</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><span className="dot" style={{ background: 'var(--expense)' }} /> Chi ra</span>
            </div>
          </div>
          <BarChart data={monthlyChart} />
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Spending breakdown */}
          <div className="card" style={{ padding: '18px 20px' }}>
            <div className="section-title">Chi tiêu theo danh mục</div>
            <SpendDonut transactions={transactions} categories={categories} />
          </div>
        </div>
      </div>

      {/* Recent transactions */}
      <div className="card">
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="section-title" style={{ marginBottom: 0 }}>Giao dịch gần đây</div>
          <button className="btn btn-ghost btn-xs" onClick={() => setPage('transactions')}>Xem tất cả</button>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Ngày</th>
                <th>Loại</th>
                <th>Danh mục</th>
                <th>Người nhận / Thành viên</th>
                <th style={{ textAlign: 'right' }}>Số tiền</th>
                <th>Ghi chú</th>
              </tr>
            </thead>
            <tbody>
              {recent.map(tx => {
                const cat = getCatById(tx.categoryId);
                return (
                  <tr key={tx.id}>
                    <td style={{ whiteSpace: 'nowrap', fontSize: 13 }}>{formatDate(tx.date, true)}</td>
                    <td>
                      <span className={'badge ' + (tx.type === 'income' ? 'badge-income' : 'badge-expense')}>
                        {tx.type === 'income' ? 'Thu' : 'Chi'}
                      </span>
                    </td>
                    <td>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13 }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: cat?.color || '#94a3b8', flexShrink: 0 }} />
                        {cat ? `${cat.code} · ${cat.name}` : '—'}
                      </span>
                    </td>
                    <td style={{ fontSize: 13 }}>{tx.recipientName || '—'}</td>
                    <td style={{ textAlign: 'right', fontFamily: 'Space Grotesk, sans-serif', fontWeight: 600, fontSize: 13, color: tx.type === 'income' ? 'var(--income)' : 'var(--expense)' }}>
                      {tx.type === 'income' ? '+' : '−'}{formatVNDFull(tx.amount)}
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--text-3)', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tx.note || '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { Dashboard });
