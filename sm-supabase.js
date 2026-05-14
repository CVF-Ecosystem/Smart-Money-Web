'use strict';

/* ============================================================================
 *  Smart Money — Supabase Data Service Layer
 *  Thay thế MOCK_DATA bằng Supabase PostgreSQL + Auth
 * ============================================================================ */

// ── Supabase Client Setup ───────────────────────────────────────────────────
let supabase = null;
let currentUser = null;
let currentOrgId = null;

/**
 * Initialize Supabase client
 * @param {string} supabaseUrl - Your Supabase project URL
 * @param {string} supabaseAnonKey - Your Supabase anon/public key
 */
function initSupabase(supabaseUrl, supabaseAnonKey) {
  if (!window.supabase) {
    console.error('❌ Supabase JS library not loaded. Add: <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>');
    return false;
  }
  
  supabase = window.supabase.createClient(supabaseUrl, supabaseAnonKey);
  console.log('✅ Supabase client initialized');
  return true;
}

/**
 * Check if Supabase is initialized
 */
function isSupabaseReady() {
  return supabase !== null;
}

// ── Authentication ───────────────────────────────────────────────────────────

/**
 * Sign in with email/password
 */
async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  
  currentUser = data.user;
  await loadUserProfile();
  return data;
}

/**
 * Sign in with Google OAuth
 */
async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.origin }
  });
  if (error) throw error;
  return data;
}

/**
 * Sign out
 */
async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
  currentUser = null;
  currentOrgId = null;
}

/**
 * Get current session
 */
async function getSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  
  if (data.session) {
    currentUser = data.session.user;
    await loadUserProfile();
  }
  return data.session;
}

/**
 * Load user profile and organization
 */
async function loadUserProfile() {
  if (!currentUser) return null;
  
  const { data, error } = await supabase
    .from('profiles')
    .select('*, organizations(*)')
    .eq('id', currentUser.id)
    .single();
  
  if (error) throw error;
  
  currentOrgId = data.organization_id;
  return data;
}

/**
 * Listen to auth state changes
 */
function onAuthStateChange(callback) {
  return supabase.auth.onAuthStateChange((event, session) => {
    if (session) {
      currentUser = session.user;
      loadUserProfile().then(() => callback(event, session));
    } else {
      currentUser = null;
      currentOrgId = null;
      callback(event, null);
    }
  });
}

// ── Categories ───────────────────────────────────────────────────────────────

async function getCategories(type = null) {
  let query = supabase
    .from('categories')
    .select('*')
    .eq('organization_id', currentOrgId)
    .order('code');
  
  if (type) query = query.eq('type', type);
  
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

async function getCategoryById(id) {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) throw error;
  return data;
}

async function addCategory(category) {
  const { data, error } = await supabase
    .from('categories')
    .insert([{ ...category, organization_id: currentOrgId }])
    .select()
    .single();
  
  if (error) throw error;
  await logAudit('INSERT', 'categories', data.id, null, data);
  return data;
}

async function updateCategory(id, updates) {
  const old = await getCategoryById(id);
  
  const { data, error } = await supabase
    .from('categories')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  await logAudit('UPDATE', 'categories', id, old, data);
  return data;
}

async function deleteCategory(id) {
  const old = await getCategoryById(id);
  
  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
  await logAudit('DELETE', 'categories', id, old, null);
}

// ── Members ──────────────────────────────────────────────────────────────────

async function getMembers() {
  const { data, error } = await supabase
    .from('members')
    .select('*')
    .eq('organization_id', currentOrgId)
    .order('code');
  
  if (error) throw error;
  return data;
}

async function getMemberById(id) {
  const { data, error } = await supabase
    .from('members')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) throw error;
  return data;
}

async function addMember(member) {
  const { data, error } = await supabase
    .from('members')
    .insert([{ ...member, organization_id: currentOrgId }])
    .select()
    .single();
  
  if (error) throw error;
  await logAudit('INSERT', 'members', data.id, null, data);
  return data;
}

async function updateMember(id, updates) {
  const old = await getMemberById(id);
  
  const { data, error } = await supabase
    .from('members')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  await logAudit('UPDATE', 'members', id, old, data);
  return data;
}

async function deleteMember(id) {
  const old = await getMemberById(id);
  
  const { error } = await supabase
    .from('members')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
  await logAudit('DELETE', 'members', id, old, null);
}

// ── Transactions ─────────────────────────────────────────────────────────────

async function getTransactions(filters = {}) {
  let query = supabase
    .from('transactions')
    .select('*, categories(*), members(*), fund_accounts(*)')
    .eq('organization_id', currentOrgId)
    .order('date', { ascending: false });
  
  if (filters.type) query = query.eq('type', filters.type);
  if (filters.categoryId) query = query.eq('category_id', filters.categoryId);
  if (filters.memberId) query = query.eq('member_id', filters.memberId);
  if (filters.fundAccountId) query = query.eq('fund_account_id', filters.fundAccountId);
  if (filters.startDate) query = query.gte('date', filters.startDate);
  if (filters.endDate) query = query.lte('date', filters.endDate);
  if (filters.search) {
    query = query.or(`recipient_name.ilike.%${filters.search}%,note.ilike.%${filters.search}%`);
  }
  
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

async function getTransactionById(id) {
  const { data, error } = await supabase
    .from('transactions')
    .select('*, categories(*), members(*), fund_accounts(*)')
    .eq('id', id)
    .single();
  
  if (error) throw error;
  return data;
}

async function addTransaction(transaction) {
  const { data, error } = await supabase
    .from('transactions')
    .insert([{
      ...transaction,
      organization_id: currentOrgId,
      created_by: currentUser?.id
    }])
    .select()
    .single();
  
  if (error) throw error;
  await logAudit('INSERT', 'transactions', data.id, null, data);
  return data;
}

async function updateTransaction(id, updates) {
  const old = await getTransactionById(id);
  
  const { data, error } = await supabase
    .from('transactions')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  await logAudit('UPDATE', 'transactions', id, old, data);
  return data;
}

async function deleteTransaction(id) {
  const old = await getTransactionById(id);
  
  const { error } = await supabase
    .from('transactions')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
  await logAudit('DELETE', 'transactions', id, old, null);
}

// ── Fund Accounts ────────────────────────────────────────────────────────────

async function getFundAccounts() {
  const { data, error } = await supabase
    .from('fund_accounts')
    .select('*')
    .eq('organization_id', currentOrgId)
    .order('created_at');
  
  if (error) throw error;
  return data;
}

async function getFundBalance(fundAccountId) {
  const { data, error } = await supabase
    .from('v_fund_balances')
    .select('*')
    .eq('id', fundAccountId)
    .single();
  
  if (error) throw error;
  return data;
}

async function addFundAccount(fundAccount) {
  const { data, error } = await supabase
    .from('fund_accounts')
    .insert([{ ...fundAccount, organization_id: currentOrgId }])
    .select()
    .single();
  
  if (error) throw error;
  await logAudit('INSERT', 'fund_accounts', data.id, null, data);
  return data;
}

// ── Budgets ──────────────────────────────────────────────────────────────────

async function getBudgets(month = null, year = null) {
  let query = supabase
    .from('budgets')
    .select('*, categories(*)')
    .eq('organization_id', currentOrgId);
  
  if (month) query = query.eq('month', month);
  if (year) query = query.eq('year', year);
  
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

async function addBudget(budget) {
  const { data, error } = await supabase
    .from('budgets')
    .insert([{ ...budget, organization_id: currentOrgId }])
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

async function updateBudget(id, updates) {
  const { data, error } = await supabase
    .from('budgets')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

async function deleteBudget(id) {
  const { error } = await supabase
    .from('budgets')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
}

// ── Recurring Transactions ───────────────────────────────────────────────────

async function getRecurringTransactions() {
  const { data, error } = await supabase
    .from('recurring_transactions')
    .select('*, categories(*), members(*)')
    .eq('organization_id', currentOrgId)
    .order('next_run_date');
  
  if (error) throw error;
  return data;
}

async function addRecurringTransaction(recurring) {
  const { data, error } = await supabase
    .from('recurring_transactions')
    .insert([{ ...recurring, organization_id: currentOrgId }])
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

async function updateRecurringTransaction(id, updates) {
  const { data, error } = await supabase
    .from('recurring_transactions')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

async function deleteRecurringTransaction(id) {
  const { error } = await supabase
    .from('recurring_transactions')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
}

/**
 * Process recurring transactions that are due
 * Called on app startup after login
 */
async function processRecurringTransactions() {
  const today = new Date().toISOString().split('T')[0];
  
  const { data: dueRecurring, error } = await supabase
    .from('recurring_transactions')
    .select('*')
    .eq('organization_id', currentOrgId)
    .eq('is_active', true)
    .lte('next_run_date', today);
  
  if (error) throw error;
  if (!dueRecurring || dueRecurring.length === 0) return [];
  
  const createdTransactions = [];
  
  for (const rec of dueRecurring) {
    // Create new transaction
    const newTx = await addTransaction({
      date: today,
      type: rec.type,
      amount: rec.amount,
      category_id: rec.category_id,
      member_id: rec.member_id,
      recipient_name: rec.name,
      note: `Tự động từ giao dịch định kỳ: ${rec.name}`
    });
    
    createdTransactions.push(newTx);
    
    // Calculate next run date
    const nextDate = new Date(rec.next_run_date);
    if (rec.frequency === 'monthly') {
      nextDate.setMonth(nextDate.getMonth() + 1);
    } else if (rec.frequency === 'quarterly') {
      nextDate.setMonth(nextDate.getMonth() + 3);
    } else if (rec.frequency === 'yearly') {
      nextDate.setFullYear(nextDate.getFullYear() + 1);
    }
    
    // Update recurring transaction
    await updateRecurringTransaction(rec.id, {
      last_run_date: today,
      next_run_date: nextDate.toISOString().split('T')[0]
    });
  }
  
  return createdTransactions;
}

// ── Settings ─────────────────────────────────────────────────────────────────

async function getSettings() {
  const { data, error } = await supabase
    .from('org_settings')
    .select('*')
    .eq('organization_id', currentOrgId)
    .single();
  
  if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
  return data || { default_currency: 'VND', language: 'vi', fiscal_year_start: 1 };
}

async function updateSettings(settings) {
  const { data, error } = await supabase
    .from('org_settings')
    .upsert({
      organization_id: currentOrgId,
      ...settings,
      updated_at: new Date().toISOString()
    })
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

// ── Audit Log ────────────────────────────────────────────────────────────────

async function getAuditLog(limit = 50) {
  const { data, error } = await supabase
    .from('audit_log')
    .select('*, profiles(full_name)')
    .eq('org_id', currentOrgId)
    .order('created_at', { ascending: false })
    .limit(limit);
  
  if (error) throw error;
  return data;
}

async function logAudit(action, tableName, recordId, oldData, newData) {
  const { error } = await supabase
    .from('audit_log')
    .insert([{
      org_id: currentOrgId,
      actor_id: currentUser?.id,
      table_name: tableName,
      record_id: recordId,
      action: action,
      old_data: oldData,
      new_data: newData
    }]);
  
  if (error) console.error('Failed to log audit:', error);
}

// ── Reports ──────────────────────────────────────────────────────────────────

async function getMonthlySummary(year = null) {
  let query = supabase
    .from('v_monthly_summary')
    .select('*')
    .eq('organization_id', currentOrgId)
    .order('month', { ascending: false });
  
  if (year) {
    query = query.gte('month', `${year}-01-01`).lte('month', `${year}-12-31`);
  }
  
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

async function getMemberPaymentStatus() {
  const { data, error } = await supabase
    .from('v_member_payment_status')
    .select('*')
    .eq('organization_id', currentOrgId)
    .order('code');
  
  if (error) throw error;
  return data;
}

// ── Seed Data ────────────────────────────────────────────────────────────────

/**
 * Seed initial data from MOCK_DATA
 * Call this once when organization is first created
 */
async function seedFromMockData(mockData) {
  console.log('🌱 Seeding data from MOCK_DATA...');
  
  try {
    // 1. Create categories
    const categoryMap = {};
    for (const cat of mockData.categories) {
      const newCat = await addCategory({
        code: cat.code,
        name: cat.name,
        name_en: cat.nameEn,
        type: cat.type,
        color: cat.color
      });
      categoryMap[cat.id] = newCat.id;
    }
    
    // 2. Create members
    const memberMap = {};
    for (const mem of mockData.members) {
      const newMem = await addMember({
        code: mem.code,
        name: mem.name,
        monthly_due: mem.monthlyDue
      });
      memberMap[mem.id] = newMem.id;
    }
    
    // 3. Create fund account
    const fundAccount = await addFundAccount({
      name: mockData.fundAccount.name,
      initial_balance: mockData.fundAccount.initialBalance,
      currency: 'VND'
    });
    
    // 4. Create transactions
    for (const tx of mockData.transactions) {
      await addTransaction({
        date: tx.date,
        type: tx.type,
        amount: tx.amount,
        category_id: categoryMap[tx.categoryId],
        member_id: tx.memberId ? memberMap[tx.memberId] : null,
        fund_account_id: fundAccount.id,
        recipient_name: tx.recipientName,
        note: tx.note
      });
    }
    
    // 5. Create recurring transactions
    for (const rec of mockData.recurring) {
      await addRecurringTransaction({
        name: rec.name,
        frequency: rec.frequency,
        day_of_month: rec.dayOfMonth,
        type: rec.type,
        amount: rec.amount,
        category_id: categoryMap[rec.categoryId],
        is_active: rec.isActive,
        next_run_date: rec.nextRunDate
      });
    }
    
    console.log('✅ Seed data completed');
    return true;
  } catch (error) {
    console.error('❌ Seed data failed:', error);
    throw error;
  }
}

// ── Export API ───────────────────────────────────────────────────────────────

window.SupabaseService = {
  // Setup
  initSupabase,
  isSupabaseReady,
  
  // Auth
  signIn,
  signInWithGoogle,
  signOut,
  getSession,
  loadUserProfile,
  onAuthStateChange,
  
  // Categories
  getCategories,
  getCategoryById,
  addCategory,
  updateCategory,
  deleteCategory,
  
  // Members
  getMembers,
  getMemberById,
  addMember,
  updateMember,
  deleteMember,
  
  // Transactions
  getTransactions,
  getTransactionById,
  addTransaction,
  updateTransaction,
  deleteTransaction,
  
  // Fund Accounts
  getFundAccounts,
  getFundBalance,
  addFundAccount,
  
  // Budgets
  getBudgets,
  addBudget,
  updateBudget,
  deleteBudget,
  
  // Recurring
  getRecurringTransactions,
  addRecurringTransaction,
  updateRecurringTransaction,
  deleteRecurringTransaction,
  processRecurringTransactions,
  
  // Settings
  getSettings,
  updateSettings,
  
  // Audit
  getAuditLog,
  
  // Reports
  getMonthlySummary,
  getMemberPaymentStatus,
  
  // Seed
  seedFromMockData,
  
  // Getters
  getCurrentUser: () => currentUser,
  getCurrentOrgId: () => currentOrgId,
};

console.log('📦 Supabase Service loaded');
