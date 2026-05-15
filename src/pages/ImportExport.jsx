import React, { useState, useEffect } from 'react';
import { DataAdapter } from '../sm-data-adapter.js';
import { Toast } from '../sm-toast.jsx';
import { IC } from '../sm-icons.jsx';
import { formatVND, formatVNDFull } from '../sm-data.js';
import { MOCK_DATA } from '../sm-data.js';

import { ImportExportService, importTransactionsFromExcel, exportToExcel, backupData, restoreData } from '../sm-import-export.js';
// ── Import/Export Page ────────────────────────────────────────────────────────
function ImportExport() {
  const [importing, setImporting] = React.useState(false);
  const [exporting, setExporting] = React.useState(false);
  const [backing, setBacking] = React.useState(false);
  const fileInputRef = React.useRef(null);
  const restoreInputRef = React.useRef(null);

  async function handleImport(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    try {
      setImporting(true);
      const result = await ImportExportService.importFromExcel(file);
      Toast.success(`Import thành công!\n\nĐã import: ${result.success} giao dịch\nLỗi: ${result.errors.length}\n\n${result.errors.length > 0 ? 'Chi tiết lỗi:\n' + result.errors.slice(0, 3).join('\n') : ''}`);
      window.location.reload(); // Reload to show new data
    } catch (error) {
      console.error('Import failed:', error);
      Toast.error('Import thất bại: ' + ' ' + error.message);
    } finally {
      setImporting(false);
      e.target.value = ''; // Reset input
    }
  }

  async function handleExport() {
    try {
      setExporting(true);
      await ImportExportService.exportToExcel();
      Toast.success('');
    } catch (error) {
      console.error('Export failed:', error);
      Toast.error('Export thất bại: ' + ' ' + error.message);
    } finally {
      setExporting(false);
    }
  }

  async function handleBackup() {
    try {
      setBacking(true);
      await ImportExportService.backupToJSON();
      Toast.success('');
    } catch (error) {
      console.error('Backup failed:', error);
      Toast.error('Backup thất bại: ' + ' ' + error.message);
    } finally {
      setBacking(false);
    }
  }

  async function handleRestore(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    try {
      const result = await ImportExportService.restoreFromJSON(file);
      if (result.success) {
        Toast.success('');
        window.location.reload();
      }
    } catch (error) {
      console.error('Restore failed:', error);
      Toast.error('Restore thất bại: ' + ' ' + error.message);
    } finally {
      e.target.value = '';
    }
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
      {/* Import Excel */}
      <div className="card" style={{ padding: '24px' }}>
        <div style={{ width: 48, height: 48, borderRadius: 12, background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', marginBottom: 14 }}>
          {IC.upload(22)}
        </div>
        <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6 }}>Import từ Excel</div>
        <div style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 18 }}>Đọc dữ liệu từ file .xlsx / .xls</div>
        <input ref={fileInputRef} type="file" accept=".xlsx,.xls" onChange={handleImport} style={{ display: 'none' }} />
        <button className="btn btn-ghost btn-sm" style={{ borderColor: 'var(--primary)', color: 'var(--primary)' }} 
          onClick={() => fileInputRef.current?.click()} disabled={importing}>
          {importing ? 'Đang import...' : 'Chọn file Excel'}
        </button>
      </div>

      {/* Export Excel */}
      <div className="card" style={{ padding: '24px' }}>
        <div style={{ width: 48, height: 48, borderRadius: 12, background: 'var(--income-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--income)', marginBottom: 14 }}>
          {IC.download(22)}
        </div>
        <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6 }}>Export ra Excel</div>
        <div style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 18 }}>Xuất toàn bộ giao dịch ra file .xlsx</div>
        <button className="btn btn-ghost btn-sm" style={{ borderColor: 'var(--income)', color: 'var(--income)' }} 
          onClick={handleExport} disabled={exporting}>
          {exporting ? 'Đang export...' : 'Tải xuống Excel'}
        </button>
      </div>

      {/* Backup */}
      <div className="card" style={{ padding: '24px' }}>
        <div style={{ width: 48, height: 48, borderRadius: 12, background: 'var(--warning-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--warning)', marginBottom: 14 }}>
          {IC.refresh(22)}
        </div>
        <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6 }}>Sao lưu dữ liệu</div>
        <div style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 18 }}>Lưu toàn bộ dữ liệu về thiết bị (JSON)</div>
        <button className="btn btn-ghost btn-sm" style={{ borderColor: 'var(--warning)', color: 'var(--warning)' }} 
          onClick={handleBackup} disabled={backing}>
          {backing ? 'Đang backup...' : 'Backup ngay'}
        </button>
      </div>

      {/* Restore */}
      <div className="card" style={{ padding: '24px' }}>
        <div style={{ width: 48, height: 48, borderRadius: 12, background: 'var(--expense-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--expense)', marginBottom: 14 }}>
          {IC.upload(22)}
        </div>
        <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6 }}>Khôi phục dữ liệu</div>
        <div style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 18 }}>Khôi phục từ file backup JSON</div>
        <input ref={restoreInputRef} type="file" accept=".json" onChange={handleRestore} style={{ display: 'none' }} />
        <button className="btn btn-ghost btn-sm" style={{ borderColor: 'var(--expense)', color: 'var(--expense)' }} 
          onClick={() => restoreInputRef.current?.click()}>
          Chọn file JSON
        </button>
      </div>
    </div>
  );
}


export default ImportExport;
