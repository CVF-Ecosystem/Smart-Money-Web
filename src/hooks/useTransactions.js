import { useState, useEffect, useCallback } from 'react';
import { DataAdapter } from '../sm-data-adapter.js';
import { Toast } from '../sm-toast.jsx';

export function useTransactions(filters = {}) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading]           = useState(true);

  const reload = useCallback(async () => {
    try {
      setLoading(true);
      const data = await DataAdapter.getTransactions(filters);
      setTransactions(data);
    } catch (err) {
      Toast.error('Không thể tải giao dịch: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(filters)]);

  useEffect(() => { reload(); }, [reload]);

  async function add(tx) {
    const created = await DataAdapter.addTransaction(tx);
    await reload();
    return created;
  }

  async function update(id, updates) {
    await DataAdapter.updateTransaction(id, updates);
    await reload();
  }

  async function remove(id) {
    await DataAdapter.deleteTransaction(id);
    setTransactions(prev => prev.filter(t => t.id !== id));
  }

  return { transactions, loading, reload, add, update, remove };
}
