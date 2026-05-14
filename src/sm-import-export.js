
import * as XLSX from 'xlsx';
'use strict';

/* ============================================================================
 *  Import/Export Logic — Phase 2
 *  Excel import/export + Backup/Restore
 * ============================================================================ */

const ImportExportService = {
  
  // ── Import from Excel ──────────────────────────────────────────────────────
  
  /**
   * Import transactions from Excel file
   * @param {File} file - Excel file (.xlsx)
   * @returns {Promise<{success: number, errors: string[]}>}
   */
  async importFromExcel(file) {
    if (!window.XLSX) {
      throw new Error('SheetJS library not loaded. Add: <script src="https://cdn.sheetjs.com/xlsx-latest/package/dist/xlsx.full.min.js"></script>');
    }
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          
          const results = {
            success: 0,
            errors: [],
            preview: []
          };
          
          // Process first sheet
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);
          
          console.log('📊 Parsed Excel data:', jsonData);
          
          // Get categories and members for mapping
          const categories = await DataAdapter.getCategories();
          const members = await DataAdapter.getMembers();
          
          // Map Excel columns to transaction schema
          for (const row of jsonData) {
            try {
              const transaction = await this._mapExcelRowToTransaction(row, categories, members);
              
              if (transaction) {
                // Preview first 5
                if (results.preview.length < 5) {
                  results.preview.push(transaction);
                }
                
                // Import to database
                await DataAdapter.addTransaction(transaction);
                results.success++;
              }
            } catch (error) {
              results.errors.push(`Row ${results.success + results.errors.length + 1}: ${error.message}`);
            }
          }
          
          resolve(results);
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsArrayBuffer(file);
    });
  },
  
  /**
   * Map Excel row to transaction object
   * Expected columns: Ngày, Loại, Số tiền, Danh mục, Thành viên, Người nhận, Ghi chú
   */
  _mapExcelRowToTransaction(row, categories, members) {
    // Try different column name variations
    const date = row['Ngày'] || row['Date'] || row['date'] || row['Ngay'];
    const type = row['Loại'] || row['Type'] || row['type'] || row['Loai'];
    const amount = row['Số tiền'] || row['Amount'] || row['amount'] || row['So tien'];
    const categoryCode = row['Mã danh mục'] || row['Danh mục'] || row['Category'] || row['Ma danh muc'];
    const memberCode = row['Mã thành viên'] || row['Thành viên'] || row['Member'] || row['Ma thanh vien'];
    const recipientName = row['Người nhận'] || row['Recipient'] || row['Nguoi nhan'];
    const note = row['Ghi chú'] || row['Note'] || row['Ghi chu'];
    
    if (!date || !amount) {
      throw new Error('Missing required fields: Ngày, Số tiền');
    }
    
    // Parse date
    let parsedDate;
    if (typeof date === 'number') {
      // Excel serial date
      parsedDate = XLSX.SSF.parse_date_code(date);
      parsedDate = `${parsedDate.y}-${String(parsedDate.m).padStart(2, '0')}-${String(parsedDate.d).padStart(2, '0')}`;
    } else {
      parsedDate = date;
    }
    
    // Determine type
    let txType = 'expense';
    if (type) {
      const typeStr = String(type).toLowerCase();
      if (typeStr.includes('thu') || typeStr.includes('income')) {
        txType = 'income';
      }
    }
    
    // Find category by code or name
    let category = null;
    if (categoryCode) {
      category = categories.find(c => 
        c.code === categoryCode || 
        c.name === categoryCode ||
        c.name_en === categoryCode
      );
    }
    
    // Find member by code or name
    let member = null;
    if (memberCode) {
      member = members.find(m => 
        m.code === memberCode || 
        m.name === memberCode
      );
    }
    
    return {
      date: parsedDate,
      type: txType,
      amount: Number(amount),
      categoryId: category?.id || null,
      memberId: member?.id || null,
      recipientName: recipientName || '',
      note: note || ''
    };
  },
  
  // ── Export to Excel ────────────────────────────────────────────────────────
  
  /**
   * Export transactions to Excel file
   * @param {Array} transactions - Transactions to export
   * @param {string} filename - Output filename
   */
  async exportToExcel(transactions = null, filename = 'transactions.xlsx') {
    if (!window.XLSX) {
      throw new Error('SheetJS library not loaded');
    }
    
    // Get all transactions if not provided
    if (!transactions) {
      transactions = await DataAdapter.getTransactions();
    }
    
    // Get categories and members for lookup
    const categories = await DataAdapter.getCategories();
    const members = await DataAdapter.getMembers();
    
    // Map to Excel format
    const excelData = transactions.map(tx => {
      const cat = categories.find(c => c.id === tx.categoryId || c.id === tx.category_id);
      const mem = members.find(m => m.id === tx.memberId || m.id === tx.member_id);
      
      return {
        'Ngày': tx.date,
        'Loại': tx.type === 'income' ? 'Thu vào' : 'Chi ra',
        'Số tiền': tx.amount,
        'Mã danh mục': cat?.code || '',
        'Tên danh mục': cat?.name || '',
        'Mã thành viên': mem?.code || '',
        'Tên thành viên': mem?.name || '',
        'Người nhận': tx.recipientName || tx.recipient_name || '',
        'Ghi chú': tx.note || ''
      };
    });
    
    // Create workbook
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(excelData);
    
    // Set column widths
    ws['!cols'] = [
      { wch: 12 }, // Ngày
      { wch: 10 }, // Loại
      { wch: 15 }, // Số tiền
      { wch: 12 }, // Mã danh mục
      { wch: 25 }, // Tên danh mục
      { wch: 12 }, // Mã thành viên
      { wch: 20 }, // Tên thành viên
      { wch: 25 }, // Người nhận
      { wch: 40 }, // Ghi chú
    ];
    
    XLSX.utils.book_append_sheet(wb, ws, 'Giao dịch');
    
    // Add summary sheet
    const summary = this._generateSummarySheet(transactions, categories);
    const wsSummary = XLSX.utils.json_to_sheet(summary);
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Tổng hợp');
    
    // Download
    XLSX.writeFile(wb, filename);
    
    return { success: true, count: transactions.length };
  },
  
  _generateSummarySheet(transactions, categories) {
    const totalIncome = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const totalExpense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    
    const summary = [
      { 'Chỉ tiêu': 'Tổng thu', 'Giá trị': totalIncome },
      { 'Chỉ tiêu': 'Tổng chi', 'Giá trị': totalExpense },
      { 'Chỉ tiêu': 'Chênh lệch', 'Giá trị': totalIncome - totalExpense },
      { 'Chỉ tiêu': '', 'Giá trị': '' },
      { 'Chỉ tiêu': 'Chi tiết theo danh mục', 'Giá trị': '' },
    ];
    
    // Group by category
    const byCategory = {};
    transactions.forEach(tx => {
      const catId = tx.categoryId || tx.category_id;
      if (!byCategory[catId]) {
        byCategory[catId] = { income: 0, expense: 0 };
      }
      if (tx.type === 'income') {
        byCategory[catId].income += tx.amount;
      } else {
        byCategory[catId].expense += tx.amount;
      }
    });
    
    Object.entries(byCategory).forEach(([catId, amounts]) => {
      const cat = categories.find(c => c.id === catId);
      if (cat) {
        summary.push({
          'Chỉ tiêu': `${cat.code} - ${cat.name}`,
          'Giá trị': amounts.income || amounts.expense
        });
      }
    });
    
    return summary;
  },
  
  // ── Backup & Restore ───────────────────────────────────────────────────────
  
  /**
   * Backup all data to JSON file
   */
  async backupToJSON(filename = `backup-${new Date().toISOString().split('T')[0]}.json`) {
    try {
      const [
        transactions,
        categories,
        members,
        budgets,
        recurring,
        fundAccounts,
        settings
      ] = await Promise.all([
        DataAdapter.getTransactions(),
        DataAdapter.getCategories(),
        DataAdapter.getMembers(),
        DataAdapter.getBudgets(),
        DataAdapter.getRecurringTransactions(),
        DataAdapter.getFundAccounts(),
        DataAdapter.getSettings()
      ]);
      
      const backup = {
        version: '1.0',
        timestamp: new Date().toISOString(),
        data: {
          transactions,
          categories,
          members,
          budgets,
          recurring,
          fundAccounts,
          settings
        }
      };
      
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      
      return { success: true, filename };
    } catch (error) {
      console.error('Backup failed:', error);
      throw error;
    }
  },
  
  /**
   * Restore data from JSON backup file
   */
  async restoreFromJSON(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        try {
          const backup = JSON.parse(e.target.result);
          
          if (!backup.version || !backup.data) {
            throw new Error('Invalid backup file format');
          }
          
          // Confirm before restore
          const confirmed = confirm(
            `Khôi phục dữ liệu từ backup?\n\n` +
            `Ngày backup: ${new Date(backup.timestamp).toLocaleString('vi-VN')}\n` +
            `Giao dịch: ${backup.data.transactions?.length || 0}\n` +
            `Danh mục: ${backup.data.categories?.length || 0}\n` +
            `Thành viên: ${backup.data.members?.length || 0}\n\n` +
            `⚠️ Dữ liệu hiện tại sẽ BỊ GHI ĐÈ!`
          );
          
          if (!confirmed) {
            resolve({ success: false, message: 'Cancelled by user' });
            return;
          }
          
          // Restore data
          const results = {
            categories: 0,
            members: 0,
            transactions: 0,
            budgets: 0,
            recurring: 0,
            errors: []
          };
          
          // In Mock mode: Replace MOCK_DATA
          if (!DataAdapter.isSupabaseMode()) {
            // Replace MOCK_DATA with backup data
            if (backup.data.categories) {
              MOCK_DATA.categories = backup.data.categories;
              results.categories = backup.data.categories.length;
            }
            if (backup.data.members) {
              MOCK_DATA.members = backup.data.members;
              results.members = backup.data.members.length;
            }
            if (backup.data.transactions) {
              MOCK_DATA.transactions = backup.data.transactions;
              results.transactions = backup.data.transactions.length;
            }
            if (backup.data.budgets) {
              MOCK_DATA.budgets = backup.data.budgets;
              results.budgets = backup.data.budgets.length;
            }
            if (backup.data.recurring) {
              MOCK_DATA.recurring = backup.data.recurring;
              results.recurring = backup.data.recurring.length;
            }
            
            resolve({ success: true, ...results });
            return;
          }
          
          // In Supabase mode: Import to database
          // Note: This is simplified - in production should handle conflicts better
          try {
            // Import categories
            if (backup.data.categories) {
              for (const cat of backup.data.categories) {
                try {
                  await DataAdapter.addCategory({
                    code: cat.code,
                    name: cat.name,
                    name_en: cat.name_en || cat.nameEn,
                    type: cat.type,
                    color: cat.color
                  });
                  results.categories++;
                } catch (err) {
                  results.errors.push(`Category ${cat.code}: ${err.message}`);
                }
              }
            }
            
            // Import members
            if (backup.data.members) {
              for (const mem of backup.data.members) {
                try {
                  await DataAdapter.addMember({
                    code: mem.code,
                    name: mem.name,
                    monthly_due: mem.monthly_due || mem.monthlyDue
                  });
                  results.members++;
                } catch (err) {
                  results.errors.push(`Member ${mem.code}: ${err.message}`);
                }
              }
            }
            
            // Import transactions
            if (backup.data.transactions) {
              for (const tx of backup.data.transactions) {
                try {
                  await DataAdapter.addTransaction({
                    date: tx.date,
                    type: tx.type,
                    amount: tx.amount,
                    category_id: tx.category_id || tx.categoryId,
                    member_id: tx.member_id || tx.memberId,
                    recipient_name: tx.recipient_name || tx.recipientName,
                    note: tx.note
                  });
                  results.transactions++;
                } catch (err) {
                  results.errors.push(`Transaction: ${err.message}`);
                }
              }
            }
            
            resolve({ success: true, ...results });
          } catch (error) {
            reject(error);
          }
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  },
  
};

// Export to window
window.ImportExportService = ImportExportService;

console.log('📦 Import/Export Service loaded');
