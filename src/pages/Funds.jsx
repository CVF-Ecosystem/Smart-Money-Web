import React, { useState, useEffect } from 'react';
import { DataAdapter } from '../sm-data-adapter.js';
import { Toast } from '../sm-toast.jsx';
import { IC } from '../sm-icons.jsx';
import { formatVND, formatVNDFull } from '../sm-data.js';
import { MOCK_DATA } from '../sm-data.js';

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


export default Funds;
