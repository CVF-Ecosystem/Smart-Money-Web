import { useState, useEffect, useCallback } from 'react';
import { DataAdapter } from '../sm-data-adapter.js';
import { Toast } from '../sm-toast.jsx';

export function usePersonalData() {
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    try {
      setLoading(true);
      const d = await DataAdapter.getPersonalData();
      setData(d);
    } catch (err) {
      Toast.error('Không thể tải dữ liệu cá nhân: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { reload(); }, [reload]);

  return { data, loading, reload };
}
