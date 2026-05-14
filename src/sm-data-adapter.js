
'use strict';

/* ============================================================================
 *  Data Adapter — Unified API cho cả Supabase và MOCK_DATA
 *  Components sẽ gọi DataAdapter thay vì trực tiếp gọi SupabaseService
 * ============================================================================ */

const DataAdapter = {
  // ── Mode Detection ─────────────────────────────────────────────────────────
  
  isSupabaseMode() {
    return window.SUPABASE_CONFIG?.enabled && window.SupabaseService?.isSupabaseReady();
  },
  
  // ── Auth ───────────────────────────────────────────────────────────────────
  
  async signIn(email, password) {
    if (this.isSupabaseMode()) {
      return await SupabaseService.signIn(email, password);
    }
    // Mock mode: always success
    return { user: MOCK_DATA.user };
  },
  
  async signOut() {
    if (this.isSupabaseMode()) {
      return await SupabaseService.signOut();
    }
    // Mock mode: do nothing
  },
  
  async getSession() {
    if (this.isSupabaseMode()) {
      return await SupabaseService.getSession();
    }
    // Mock mode: return mock user
    return { user: MOCK_DATA.user };
  },
  
  getCurrentUser() {
    if (this.isSupabaseMode()) {
      return SupabaseService.getCurrentUser();
    }
    return MOCK_DATA.user;
  },
  
  // ── Categories ─────────────────────────────────────────────────────────────
  
  async getCategories(type = null) {
    if (this.isSupabaseMode()) {
      return await SupabaseService.getCategories(type);
    }
    // Mock mode
    let cats = [...MOCK_DATA.categories];
    if (type) cats = cats.filter(c => c.type === type);
    return cats;
  },
  
  async addCategory(category) {
    if (this.isSupabaseMode()) {
      return await SupabaseService.addCategory(category);
    }
    // Mock mode: add to MOCK_DATA
    const newCat = {
      id: 'c' + (MOCK_DATA.categories.length + 1),
      ...category
    };
    MOCK_DATA.categories.push(newCat);
    return newCat;
  },
  
  async updateCategory(id, updates) {
    if (this.isSupabaseMode()) {
      return await SupabaseService.updateCategory(id, updates);
    }
    // Mock mode
    const cat = MOCK_DATA.categories.find(c => c.id === id);
    if (cat) Object.assign(cat, updates);
    return cat;
  },
  
  async deleteCategory(id) {
    if (this.isSupabaseMode()) {
      return await SupabaseService.deleteCategory(id);
    }
    // Mock mode
    const idx = MOCK_DATA.categories.findIndex(c => c.id === id);
    if (idx >= 0) MOCK_DATA.categories.splice(idx, 1);
  },
  
  // ── Members ────────────────────────────────────────────────────────────────
  
  async getMembers() {
    if (this.isSupabaseMode()) {
      return await SupabaseService.getMembers();
    }
    return [...MOCK_DATA.members];
  },
  
  async addMember(member) {
    if (this.isSupabaseMode()) {
      return await SupabaseService.addMember(member);
    }
    // Mock mode
    const newMem = {
      id: 'm' + (MOCK_DATA.members.length + 1),
      ...member,
      totalPaid: 0,
      totalDue: member.monthlyDue * 10,
      status: 'unpaid'
    };
    MOCK_DATA.members.push(newMem);
    return newMem;
  },
  
  async updateMember(id, updates) {
    if (this.isSupabaseMode()) {
      return await SupabaseService.updateMember(id, updates);
    }
    // Mock mode
    const mem = MOCK_DATA.members.find(m => m.id === id);
    if (mem) Object.assign(mem, updates);
    return mem;
  },
  
  async deleteMember(id) {
    if (this.isSupabaseMode()) {
      return await SupabaseService.deleteMember(id);
    }
    // Mock mode
    const idx = MOCK_DATA.members.findIndex(m => m.id === id);
    if (idx >= 0) MOCK_DATA.members.splice(idx, 1);
  },
  
  // ── Transactions ───────────────────────────────────────────────────────────
  
  async getTransactions(filters = {}) {
    if (this.isSupabaseMode()) {
      return await SupabaseService.getTransactions(filters);
    }
    
    // Mock mode: filter MOCK_DATA
    let txs = [...MOCK_DATA.transactions];
    
    if (filters.type) {
      txs = txs.filter(t => t.type === filters.type);
    }
    if (filters.categoryId) {
      txs = txs.filter(t => t.categoryId === filters.categoryId);
    }
    if (filters.memberId) {
      txs = txs.filter(t => t.memberId === filters.memberId);
    }
    if (filters.startDate) {
      txs = txs.filter(t => t.date >= filters.startDate);
    }
    if (filters.endDate) {
      txs = txs.filter(t => t.date <= filters.endDate);
    }
    if (filters.search) {
      const q = filters.search.toLowerCase();
      txs = txs.filter(t => 
        (t.recipientName && t.recipientName.toLowerCase().includes(q)) ||
        (t.note && t.note.toLowerCase().includes(q))
      );
    }
    
    // Sort by date desc
    txs.sort((a, b) => b.date.localeCompare(a.date));
    
    return txs;
  },
  
  async addTransaction(transaction) {
    if (this.isSupabaseMode()) {
      return await SupabaseService.addTransaction(transaction);
    }
    
    // Mock mode
    const newTx = {
      id: 'tx' + (MOCK_DATA.transactions.length + 1).toString().padStart(2, '0'),
      ...transaction
    };
    MOCK_DATA.transactions.unshift(newTx);
    
    // Update stats
    this._recalculateStats();
    
    return newTx;
  },
  
  async updateTransaction(id, updates) {
    if (this.isSupabaseMode()) {
      return await SupabaseService.updateTransaction(id, updates);
    }
    
    // Mock mode
    const tx = MOCK_DATA.transactions.find(t => t.id === id);
    if (tx) {
      Object.assign(tx, updates);
      this._recalculateStats();
    }
    return tx;
  },
  
  async deleteTransaction(id) {
    if (this.isSupabaseMode()) {
      return await SupabaseService.deleteTransaction(id);
    }
    
    // Mock mode
    const idx = MOCK_DATA.transactions.findIndex(t => t.id === id);
    if (idx >= 0) {
      MOCK_DATA.transactions.splice(idx, 1);
      this._recalculateStats();
    }
  },
  
  // ── Budgets ────────────────────────────────────────────────────────────────
  
  async getBudgets(month = null, year = null) {
    if (this.isSupabaseMode()) {
      return await SupabaseService.getBudgets(month, year);
    }
    return [...MOCK_DATA.budgets];
  },
  
  async addBudget(budget) {
    if (this.isSupabaseMode()) {
      return await SupabaseService.addBudget(budget);
    }
    const newBudget = {
      id: 'b' + (MOCK_DATA.budgets.length + 1),
      ...budget,
      spent: 0
    };
    MOCK_DATA.budgets.push(newBudget);
    return newBudget;
  },
  
  async updateBudget(id, updates) {
    if (this.isSupabaseMode()) {
      return await SupabaseService.updateBudget(id, updates);
    }
    const budget = MOCK_DATA.budgets.find(b => b.id === id);
    if (budget) Object.assign(budget, updates);
    return budget;
  },
  
  async deleteBudget(id) {
    if (this.isSupabaseMode()) {
      return await SupabaseService.deleteBudget(id);
    }
    const idx = MOCK_DATA.budgets.findIndex(b => b.id === id);
    if (idx >= 0) MOCK_DATA.budgets.splice(idx, 1);
  },
  
  // ── Recurring Transactions ─────────────────────────────────────────────────
  
  async getRecurringTransactions() {
    if (this.isSupabaseMode()) {
      return await SupabaseService.getRecurringTransactions();
    }
    return [...MOCK_DATA.recurring];
  },
  
  async addRecurringTransaction(recurring) {
    if (this.isSupabaseMode()) {
      return await SupabaseService.addRecurringTransaction(recurring);
    }
    const newRec = {
      id: 'r' + (MOCK_DATA.recurring.length + 1),
      ...recurring
    };
    MOCK_DATA.recurring.push(newRec);
    return newRec;
  },
  
  async updateRecurringTransaction(id, updates) {
    if (this.isSupabaseMode()) {
      return await SupabaseService.updateRecurringTransaction(id, updates);
    }
    const rec = MOCK_DATA.recurring.find(r => r.id === id);
    if (rec) Object.assign(rec, updates);
    return rec;
  },
  
  async deleteRecurringTransaction(id) {
    if (this.isSupabaseMode()) {
      return await SupabaseService.deleteRecurringTransaction(id);
    }
    const idx = MOCK_DATA.recurring.findIndex(r => r.id === id);
    if (idx >= 0) MOCK_DATA.recurring.splice(idx, 1);
  },
  
  async processRecurringTransactions() {
    if (this.isSupabaseMode()) {
      return await SupabaseService.processRecurringTransactions();
    }
    
    // Mock mode: simple implementation
    const today = new Date().toISOString().split('T')[0];
    const dueRecurring = MOCK_DATA.recurring.filter(r => 
      r.isActive && r.nextRunDate <= today
    );
    
    const created = [];
    for (const rec of dueRecurring) {
      const newTx = await this.addTransaction({
        date: today,
        type: rec.type,
        amount: rec.amount,
        categoryId: rec.categoryId,
        memberId: rec.memberId || null,
        recipientName: rec.name,
        note: `Tự động từ giao dịch định kỳ: ${rec.name}`
      });
      created.push(newTx);
      
      // Update next run date
      const nextDate = new Date(rec.nextRunDate);
      if (rec.frequency === 'monthly') {
        nextDate.setMonth(nextDate.getMonth() + 1);
      } else if (rec.frequency === 'quarterly') {
        nextDate.setMonth(nextDate.getMonth() + 3);
      } else if (rec.frequency === 'yearly') {
        nextDate.setFullYear(nextDate.getFullYear() + 1);
      }
      
      rec.lastRunDate = today;
      rec.nextRunDate = nextDate.toISOString().split('T')[0];
    }
    
    return created;
  },
  
  // ── Fund Accounts ──────────────────────────────────────────────────────────
  
  async getFundAccounts() {
    if (this.isSupabaseMode()) {
      return await SupabaseService.getFundAccounts();
    }
    return [MOCK_DATA.fundAccount];
  },
  
  async getFundBalance(fundAccountId) {
    if (this.isSupabaseMode()) {
      return await SupabaseService.getFundBalance(fundAccountId);
    }
    return MOCK_DATA.stats;
  },
  
  // ── Settings ───────────────────────────────────────────────────────────────
  
  async getSettings() {
    if (this.isSupabaseMode()) {
      return await SupabaseService.getSettings();
    }
    return {
      default_currency: 'VND',
      language: 'vi',
      fiscal_year_start: 1
    };
  },
  
  async updateSettings(settings) {
    if (this.isSupabaseMode()) {
      return await SupabaseService.updateSettings(settings);
    }
    // Mock mode: do nothing
    return settings;
  },
  
  // ── Audit Log ──────────────────────────────────────────────────────────────
  
  async getAuditLog(limit = 50) {
    if (this.isSupabaseMode()) {
      return await SupabaseService.getAuditLog(limit);
    }
    return MOCK_DATA.auditLog.slice(0, limit);
  },
  
  // ── Reports ────────────────────────────────────────────────────────────────
  
  async getMonthlySummary(year = null) {
    if (this.isSupabaseMode()) {
      return await SupabaseService.getMonthlySummary(year);
    }
    // Mock mode: return monthlyChart
    return MOCK_DATA.monthlyChart;
  },
  
  async getMemberPaymentStatus() {
    if (this.isSupabaseMode()) {
      return await SupabaseService.getMemberPaymentStatus();
    }
    // Mock mode: return members with payment info
    return MOCK_DATA.members.map(m => ({
      id: m.id,
      code: m.code,
      name: m.name,
      monthly_due: m.monthlyDue,
      total_paid: m.totalPaid,
      total_due: m.totalDue,
      balance: m.totalDue - m.totalPaid
    }));
  },
  
  // ── Approvals & Layout ─────────────────────────────────────────────────────
  
  async getPendingCounts() {
    if (this.isSupabaseMode() && SupabaseService.getPendingCounts) {
      return await SupabaseService.getPendingCounts();
    }
    return {
      approvals: MOCK_DATA.approvalRequests ? MOCK_DATA.approvalRequests.filter(r => r.status === 'pending').length : 0
    };
  },
  
  async getApprovalRequests() {
    if (this.isSupabaseMode() && SupabaseService.getApprovalRequests) {
      return await SupabaseService.getApprovalRequests();
    }
    return MOCK_DATA.approvalRequests || [];
  },

  async approveRequest(id, note = '') {
    if (this.isSupabaseMode() && SupabaseService.approveRequest) {
      return await SupabaseService.approveRequest(id, note);
    }
    const req = MOCK_DATA.approvalRequests.find(r => r.id === id);
    if (req) {
      req.status = 'approved';
      req.note = note;
      req.approvedDate = new Date().toISOString().split('T')[0];
      req.approver = MOCK_DATA.user?.name || 'Thủ quỹ';
    }
    return req;
  },

  async rejectRequest(id, note = '') {
    if (this.isSupabaseMode() && SupabaseService.rejectRequest) {
      return await SupabaseService.rejectRequest(id, note);
    }
    const req = MOCK_DATA.approvalRequests.find(r => r.id === id);
    if (req) {
      req.status = 'rejected';
      req.note = note;
      req.approver = MOCK_DATA.user?.name || 'Thủ quỹ';
    }
    return req;
  },

  // ── Personal Finance ───────────────────────────────────────────────────────
  
  async getPersonalData() {
    if (this.isSupabaseMode() && SupabaseService.getPersonalData) {
      return await SupabaseService.getPersonalData();
    }
    return {
      wallets: MOCK_DATA.personalWallets || [],
      categories: MOCK_DATA.personalCategories || [],
      categoryGroups: MOCK_DATA.personalCategoryGroups || [],
      transactions: MOCK_DATA.personalTransactions || [],
      budgets: MOCK_DATA.personalBudgets || {},
      salaryInfo: MOCK_DATA.salaryInfo || {},
      pendingItems: MOCK_DATA.pendingItems || [],
      savingsGoals: MOCK_DATA.savingsGoals || []
    };
  },

  async addPersonalTransaction(tx) {
    if (this.isSupabaseMode() && SupabaseService.addPersonalTransaction) {
      return await SupabaseService.addPersonalTransaction(tx);
    }
    const newTx = { id: 'pt_' + Date.now(), ...tx };
    MOCK_DATA.personalTransactions.unshift(newTx);
    return newTx;
  },

  async updatePersonalTransaction(id, updates) {
    if (this.isSupabaseMode() && SupabaseService.updatePersonalTransaction) {
      return await SupabaseService.updatePersonalTransaction(id, updates);
    }
    const tx = MOCK_DATA.personalTransactions.find(t => t.id === id);
    if (tx) Object.assign(tx, updates);
    return tx;
  },

  async deletePersonalTransaction(id) {
    if (this.isSupabaseMode() && SupabaseService.deletePersonalTransaction) {
      return await SupabaseService.deletePersonalTransaction(id);
    }
    const idx = MOCK_DATA.personalTransactions.findIndex(t => t.id === id);
    if (idx >= 0) MOCK_DATA.personalTransactions.splice(idx, 1);
  },

  // ── Helpers ────────────────────────────────────────────────────────────────
  
  _recalculateStats() {
    // Recalculate fund stats from transactions
    const allIncome = MOCK_DATA.transactions
      .filter(t => t.type === 'income')
      .reduce((s, t) => s + t.amount, 0);
    
    const allExpense = MOCK_DATA.transactions
      .filter(t => t.type === 'expense')
      .reduce((s, t) => s + t.amount, 0);
    
    MOCK_DATA.stats = {
      balance: MOCK_DATA.fundAccount.initialBalance + allIncome - allExpense,
      totalIncome: allIncome,
      totalExpense: allExpense,
      openingBalance: MOCK_DATA.fundAccount.initialBalance,
    };
    
    // Recalculate member payment status
    MOCK_DATA.members.forEach(m => {
      const paid = MOCK_DATA.transactions
        .filter(t => t.type === 'income' && t.memberId === m.id)
        .reduce((s, t) => s + t.amount, 0);
      
      const due = m.monthlyDue * 10;
      m.totalPaid = paid;
      m.totalDue = due;
      m.status = paid >= due ? 'paid' : paid > 0 ? 'partial' : 'unpaid';
    });
  },
};

// Export to window
window.DataAdapter = DataAdapter;

console.log('🔌 Data Adapter loaded — Mode:', DataAdapter.isSupabaseMode() ? 'Supabase' : 'Mock');
