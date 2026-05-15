
'use strict';

const currentYear = new Date().getFullYear();
const currentMonth = String(new Date().getMonth() + 1).padStart(2, '0');
const currentPrefix = `${currentYear}-${currentMonth}`;

export const MOCK_DATA = {
  user: { id: 'u1', name: 'Nguyễn Thủ Quỹ', email: 'thuquy@company.vn', role: 'Thủ quỹ', initials: 'TQ' },

  /* ── FUND DATA ─────────────────────────────────────────────────────────── */
  categories: [
    { id: 'c1', code: 'T01', name: 'Thu quỹ hàng tháng',     nameEn: 'Monthly dues',      type: 'income',  color: '#059669' },
    { id: 'c2', code: 'T02', name: 'Thu tiền công đoàn',      nameEn: 'Union fees',        type: 'income',  color: '#0284C7' },
    { id: 'c3', code: 'T03', name: 'Thu tiền thưởng / hỗ trợ',nameEn: 'Bonuses / Grants',  type: 'income',  color: '#7C3AED' },
    { id: 'c4', code: 'C01', name: 'Chi tiền vãng đàm ma',    nameEn: 'Funeral expenses',  type: 'expense', color: '#DC2626' },
    { id: 'c5', code: 'C02', name: 'Chi tiền văn phòng phẩm', nameEn: 'Office supplies',   type: 'expense', color: '#D97706' },
    { id: 'c6', code: 'C03', name: 'Chi phí khác',            nameEn: 'Other expenses',    type: 'expense', color: '#64748B' },
    { id: 'c7', code: 'C04', name: 'Chi phí vòng hoa',        nameEn: 'Wreath expenses',   type: 'expense', color: '#DB2777' },
    { id: 'c8', code: 'C05', name: 'Chi mua quà tặng',        nameEn: 'Gift expenses',     type: 'expense', color: '#9333EA' },
    { id: 'c9', code: 'C06', name: 'Chi tiền cúng lễ',        nameEn: 'Ceremony expenses', type: 'expense', color: '#C2410C' },
  ],

  members: [
    { id: 'm1',  code: 'NV001', name: 'Nguyễn Văn An',   monthlyDue: 150000 },
    { id: 'm2',  code: 'NV002', name: 'Trần Thị Bình',   monthlyDue: 150000 },
    { id: 'm3',  code: 'NV003', name: 'Lê Văn Cường',    monthlyDue: 150000 },
    { id: 'm4',  code: 'NV004', name: 'Phạm Thị Dung',   monthlyDue: 150000 },
    { id: 'm5',  code: 'NV005', name: 'Hoàng Văn Em',    monthlyDue: 200000 },
    { id: 'm6',  code: 'NV006', name: 'Vũ Thị Phương',   monthlyDue: 150000 },
    { id: 'm7',  code: 'NV007', name: 'Đỗ Văn Giang',    monthlyDue: 150000 },
    { id: 'm8',  code: 'NV008', name: 'Bùi Thị Hoa',     monthlyDue: 200000 },
    { id: 'm9',  code: 'NV009', name: 'Ngô Thị Lan',     monthlyDue: 150000 },
    { id: 'm10', code: 'NV010', name: 'Vũ Minh Khánh',   monthlyDue: 150000 },
  ],

  transactions: [
    { id: 'tx01', date: `${currentPrefix}-12`, type: 'income',  amount: 150000,  categoryId: 'c1', memberId: 'm1',  recipientName: 'Nguyễn Văn An',          note: `Nộp quỹ T${currentMonth}/${currentYear}` },
    { id: 'tx02', date: `${currentPrefix}-11`, type: 'income',  amount: 150000,  categoryId: 'c1', memberId: 'm2',  recipientName: 'Trần Thị Bình',          note: `Nộp quỹ T${currentMonth}/${currentYear}` },
    { id: 'tx03', date: `${currentPrefix}-10`, type: 'income',  amount: 150000,  categoryId: 'c1', memberId: 'm3',  recipientName: 'Lê Văn Cường',           note: `Nộp quỹ T${currentMonth}/${currentYear}` },
    { id: 'tx04', date: `${currentPrefix}-09`, type: 'expense', amount: 2500000, categoryId: 'c4', memberId: null,  recipientName: 'Gia đình bà Nguyễn Thị Mai', note: 'Phúng viếng tang lễ bà Nguyễn Thị Mai' },
    { id: 'tx05', date: `${currentPrefix}-08`, type: 'income',  amount: 200000,  categoryId: 'c1', memberId: 'm5',  recipientName: 'Hoàng Văn Em',           note: `Nộp quỹ T${currentMonth}/${currentYear}` },
    { id: 'tx06', date: `${currentPrefix}-07`, type: 'expense', amount: 450000,  categoryId: 'c5', memberId: null,  recipientName: 'Cửa hàng VP Minh Phát',  note: `Mua vật tư văn phòng tháng ${currentMonth}` },
    { id: 'tx07', date: `${currentYear}-04-30`, type: 'income',  amount: 150000,  categoryId: 'c1', memberId: 'm4',  recipientName: 'Phạm Thị Dung',          note: `Nộp quỹ T4/${currentYear}` },
    { id: 'tx08', date: `${currentYear}-04-28`, type: 'income',  amount: 150000,  categoryId: 'c1', memberId: 'm6',  recipientName: 'Vũ Thị Phương',          note: `Nộp quỹ T4/${currentYear}` },
    { id: 'tx09', date: `${currentYear}-04-25`, type: 'expense', amount: 800000,  categoryId: 'c7', memberId: null,  recipientName: 'Cửa hàng hoa Hồng Lan',  note: 'Vòng hoa viếng tang' },
    { id: 'tx10', date: `${currentYear}-04-20`, type: 'income',  amount: 5000000, categoryId: 'c3', memberId: null,  recipientName: 'Ban Giám đốc',           note: 'Hỗ trợ quỹ từ công ty' },
    { id: 'tx11', date: `${currentYear}-04-15`, type: 'expense', amount: 1200000, categoryId: 'c8', memberId: null,  recipientName: 'Đồng nghiệp',            note: 'Quà mừng thọ 70 tuổi cụ Hoàng' },
    { id: 'tx12', date: `${currentYear}-04-10`, type: 'income',  amount: 150000,  categoryId: 'c2', memberId: 'm7',  recipientName: 'Đỗ Văn Giang',           note: `Nộp công đoàn T4/${currentYear}` },
    { id: 'tx13', date: `${currentYear}-03-31`, type: 'income',  amount: 150000,  categoryId: 'c1', memberId: 'm8',  recipientName: 'Bùi Thị Hoa',            note: `Nộp quỹ T3/${currentYear}` },
    { id: 'tx14', date: `${currentYear}-03-25`, type: 'expense', amount: 3000000, categoryId: 'c4', memberId: null,  recipientName: 'Gia đình ông Trần Minh Đức', note: 'Tang lễ ông Trần Minh Đức' },
    { id: 'tx15', date: `${currentYear}-03-20`, type: 'income',  amount: 150000,  categoryId: 'c1', memberId: 'm9',  recipientName: 'Ngô Thị Lan',            note: `Nộp quỹ T3/${currentYear}` },
    { id: 'tx16', date: `${currentYear}-03-15`, type: 'expense', amount: 600000,  categoryId: 'c6', memberId: null,  recipientName: 'Misc',                    note: 'Chi phí tạp vụ tháng 3' },
    { id: 'tx17', date: `${currentYear}-03-10`, type: 'income',  amount: 150000,  categoryId: 'c1', memberId: 'm10', recipientName: 'Vũ Minh Khánh',          note: `Nộp quỹ T3/${currentYear}` },
    { id: 'tx18', date: `${currentYear}-02-28`, type: 'income',  amount: 150000,  categoryId: 'c1', memberId: 'm1',  recipientName: 'Nguyễn Văn An',          note: `Nộp quỹ T2/${currentYear}` },
    { id: 'tx19', date: `${currentYear}-02-20`, type: 'expense', amount: 500000,  categoryId: 'c9', memberId: null,  recipientName: 'Chùa Trúc Lâm',          note: 'Phí lễ cúng đầu năm' },
    { id: 'tx20', date: `${currentYear}-01-31`, type: 'income',  amount: 8400000, categoryId: 'c1', memberId: null,  recipientName: 'Nhiều thành viên',       note: 'Thu quỹ tháng 1 (hàng loạt)' },
  ],

  monthlyChart: [
    { month: 'T1',  income: 9600000,  expense: 1800000 },
    { month: 'T2',  income: 7200000,  expense: 500000  },
    { month: 'T3',  income: 8450000,  expense: 3600000 },
    { month: 'T4',  income: 10650000, expense: 2000000 },
    { month: 'T5',  income: 1200000,  expense: 2950000 },
    { month: 'T6',  income: 0, expense: 0 },
    { month: 'T7',  income: 0, expense: 0 },
    { month: 'T8',  income: 0, expense: 0 },
    { month: 'T9',  income: 0, expense: 0 },
    { month: 'T10', income: 0, expense: 0 },
    { month: 'T11', income: 0, expense: 0 },
    { month: 'T12', income: 0, expense: 0 },
  ],

  budgets: [
    { id: 'b1', categoryId: 'c4', amount: 5000000, spent: 5500000 },
    { id: 'b2', categoryId: 'c5', amount: 1000000, spent: 450000  },
    { id: 'b3', categoryId: 'c7', amount: 2000000, spent: 800000  },
    { id: 'b4', categoryId: 'c8', amount: 1500000, spent: 1200000 },
    { id: 'b5', categoryId: 'c6', amount: 1200000, spent: 600000  },
  ],

  recurring: [
    { id: 'r1', name: 'Thu quỹ hàng tháng', frequency: 'monthly',   dayOfMonth: 1,  type: 'income',  amount: 150000, categoryId: 'c1', isActive: true, nextRunDate: `${currentYear}-06-01` },
    { id: 'r2', name: 'Chi văn phòng phẩm', frequency: 'monthly',   dayOfMonth: 5,  type: 'expense', amount: 400000, categoryId: 'c5', isActive: true, nextRunDate: `${currentYear}-06-05` },
    { id: 'r3', name: 'Thu công đoàn',      frequency: 'quarterly', dayOfMonth: 10, type: 'income',  amount: 300000, categoryId: 'c2', isActive: true, nextRunDate: `${currentYear}-07-10` },
  ],

  fundAccount: { name: 'Quỹ chính', initialBalance: 38350000 },

  /* ── APPROVAL & AUDIT ─────────────────────────────────────────────────── */
  approvalRequests: [
    { id: 'ar1', reqBy: 'm2', reqName: 'Trần Thị Bình',  amount: 1500000, categoryId: 'c4', desc: 'Hỗ trợ tang lễ bà Nguyễn Thị Mai — đợt 2',    status: 'pending',  reqDate: `${currentPrefix}-11`, attach: 'hoadon_tangma.jpg', note: '' },
    { id: 'ar2', reqBy: 'm3', reqName: 'Lê Văn Cường',   amount: 350000,  categoryId: 'c5', desc: `Mua mực in và giấy A4 cho phòng họp tháng ${currentMonth}`,  status: 'pending',  reqDate: `${currentPrefix}-10`, attach: null,               note: '' },
    { id: 'ar3', reqBy: 'm5', reqName: 'Hoàng Văn Em',   amount: 800000,  categoryId: 'c7', desc: 'Vòng hoa thăm sức khỏe cụ Trần Minh Hùng',     status: 'approved', reqDate: `${currentPrefix}-08`, attach: 'vonghoa.jpg',       note: 'Đồng ý, đúng quy trình.', approvedDate: `${currentPrefix}-09`, approver: 'Nguyễn Thủ Quỹ' },
    { id: 'ar4', reqBy: 'm6', reqName: 'Vũ Thị Phương',  amount: 2000000, categoryId: 'c8', desc: 'Quà mừng sinh nhật giám đốc công ty',           status: 'rejected', reqDate: `${currentPrefix}-05`, attach: null,               note: 'Không phù hợp quy định quỹ; đây là chi phí công ty.', approver: 'Nguyễn Thủ Quỹ' },
    { id: 'ar5', reqBy: 'm7', reqName: 'Đỗ Văn Giang',   amount: 500000,  categoryId: 'c9', desc: `Cúng lễ tổ nghề tháng ${currentMonth} tại xưởng`,            status: 'pending',  reqDate: `${currentPrefix}-12`, attach: null,               note: '' },
  ],

  auditLog: [
    { id: 'al1', action: 'create',  entity: 'Giao dịch',  desc: `Thêm thu quỹ T${currentMonth} từ Nguyễn Văn An (+150.000 đ)`,         user: 'Nguyễn Thủ Quỹ', ts: `${currentPrefix}-12T09:30:00` },
    { id: 'al2', action: 'approve', entity: 'Phê duyệt',  desc: 'Duyệt đề xuất #ar3 — Vòng hoa 800.000 đ',               user: 'Nguyễn Thủ Quỹ', ts: `${currentPrefix}-09T14:22:00` },
    { id: 'al3', action: 'reject',  entity: 'Phê duyệt',  desc: 'Từ chối đề xuất #ar4 — Quà mừng giám đốc 2.000.000 đ',  user: 'Nguyễn Thủ Quỹ', ts: `${currentPrefix}-09T14:25:00` },
    { id: 'al4', action: 'edit',    entity: 'Giao dịch',  desc: 'Chỉnh sửa tx04 — Tang lễ bà Nguyễn Thị Mai',            user: 'Nguyễn Thủ Quỹ', ts: `${currentPrefix}-09T10:15:00` },
    { id: 'al5', action: 'delete',  entity: 'Giao dịch',  desc: 'Xóa bản ghi thử nghiệm tx_draft',                       user: 'Nguyễn Thủ Quỹ', ts: `${currentPrefix}-08T16:40:00` },
    { id: 'al6', action: 'create',  entity: 'Thành viên', desc: 'Thêm thành viên Vũ Minh Khánh (NV010)',                 user: 'Nguyễn Thủ Quỹ', ts: `${currentYear}-04-01T08:00:00` },
    { id: 'al7', action: 'edit',    entity: 'Danh mục',   desc: 'Cập nhật tên danh mục C04 → "Chi phí vòng hoa"',        user: 'Nguyễn Thủ Quỹ', ts: `${currentYear}-03-15T11:00:00` },
  ],

  /* ── PERSONAL FINANCE ──────────────────────────────────────────────────── */
  personalWallets: [
    { id: 'pw1', name: 'Tiền mặt',          type: 'cash',   balance: 2500000,  color: '#059669' },
    { id: 'pw2', name: 'ATM Vietcombank',    type: 'atm',    balance: 15800000, color: '#2563EB' },
    { id: 'pw3', name: 'Thẻ TD Visa',        type: 'credit', balance: -3200000, limit: 20000000, color: '#DC2626' },
  ],

  personalCategoryGroups: [
    { key: 'fixed',     name: 'Thiết yếu', color: '#7C3AED', desc: 'Cố định hàng tháng' },
    { key: 'daily',     name: 'Linh tinh',  color: '#D97706', desc: 'Sinh hoạt hàng ngày' },
    { key: 'lifestyle', name: 'Giải trí',   color: '#0891B2', desc: 'Vui chơi & Tiêu dùng' },
    { key: 'others',    name: 'Phát sinh',  color: '#DC2626', desc: 'Chi phí ngoài dự tính' },
  ],

  personalCategories: [
    { id: 'pc01', group: 'fixed',     name: 'Thuê nhà',        color: '#7C3AED' },
    { id: 'pc02', group: 'fixed',     name: 'Điện nước',       color: '#7C3AED' },
    { id: 'pc03', group: 'fixed',     name: 'Internet',        color: '#6D28D9' },
    { id: 'pc04', group: 'fixed',     name: 'Học phí',         color: '#6D28D9' },
    { id: 'pc05', group: 'fixed',     name: 'Bảo hiểm',       color: '#7C3AED' },
    { id: 'pc06', group: 'daily',     name: 'Ăn sáng',         color: '#D97706' },
    { id: 'pc07', group: 'daily',     name: 'Cà phê',          color: '#D97706' },
    { id: 'pc08', group: 'daily',     name: 'Gửi xe',          color: '#B45309' },
    { id: 'pc09', group: 'daily',     name: 'Chợ / Siêu thị',  color: '#D97706' },
    { id: 'pc10', group: 'daily',     name: 'Xăng xe',         color: '#B45309' },
    { id: 'pc11', group: 'lifestyle', name: 'Shopping',        color: '#0891B2' },
    { id: 'pc12', group: 'lifestyle', name: 'Xem phim',        color: '#0891B2' },
    { id: 'pc13', group: 'lifestyle', name: 'Nhậu nhẹt',       color: '#0369A1' },
    { id: 'pc14', group: 'lifestyle', name: 'Du lịch',         color: '#0891B2' },
    { id: 'pc15', group: 'others',    name: 'Đám hỷ',          color: '#DC2626' },
    { id: 'pc16', group: 'others',    name: 'Thuốc men',       color: '#B91C1C' },
    { id: 'pc17', group: 'others',    name: 'Sửa xe',          color: '#DC2626' },
  ],

  personalTransactions: [
    { id: 'pt01', date: `${currentPrefix}-12`, amount: 35000,   categoryId: 'pc07', walletId: 'pw1', note: 'Cà phê Highlands sáng' },
    { id: 'pt02', date: `${currentPrefix}-12`, amount: 25000,   categoryId: 'pc06', walletId: 'pw1', note: 'Bánh mì ốp la' },
    { id: 'pt03', date: `${currentPrefix}-12`, amount: 8000,    categoryId: 'pc08', walletId: 'pw1', note: 'Gửi xe cơ quan' },
    { id: 'pt04', date: `${currentPrefix}-11`, amount: 520000,  categoryId: 'pc09', walletId: 'pw2', note: 'Siêu thị Co.op Mart' },
    { id: 'pt05', date: `${currentPrefix}-11`, amount: 100000,  categoryId: 'pc10', walletId: 'pw2', note: 'Đổ xăng xe máy' },
    { id: 'pt06', date: `${currentPrefix}-10`, amount: 200000,  categoryId: 'pc13', walletId: 'pw2', note: 'Nhậu với bạn bè' },
    { id: 'pt07', date: `${currentPrefix}-08`, amount: 450000,  categoryId: 'pc11', walletId: 'pw3', note: 'Mua áo Uniqlo' },
    { id: 'pt08', date: `${currentPrefix}-07`, amount: 120000,  categoryId: 'pc12', walletId: 'pw3', note: 'Xem phim CGV' },
    { id: 'pt09', date: `${currentPrefix}-05`, amount: 500000,  categoryId: 'pc15', walletId: 'pw2', note: 'Mừng đám cưới chị Lan' },
    { id: 'pt10', date: `${currentPrefix}-03`, amount: 85000,   categoryId: 'pc16', walletId: 'pw1', note: 'Mua thuốc cảm cúm' },
    { id: 'pt11', date: `${currentPrefix}-01`, amount: 3500000, categoryId: 'pc01', walletId: 'pw2', note: `Thuê phòng tháng ${currentMonth}` },
    { id: 'pt12', date: `${currentPrefix}-01`, amount: 350000,  categoryId: 'pc02', walletId: 'pw2', note: `Tiền điện nước T${currentMonth}` },
    { id: 'pt13', date: `${currentPrefix}-01`, amount: 200000,  categoryId: 'pc03', walletId: 'pw2', note: `Internet FPT tháng ${currentMonth}` },
  ],

  salaryInfo: { monthlySalary: 15000000, salaryDay: 5 },

  personalBudgets: {
    monthly: 12000000,
    categories: { fixed: 5000000, daily: 3000000, lifestyle: 2500000, others: 1500000 },
  },

  pendingItems: [
    { id: 'pi1', amount: 45000,  name: 'Trà sữa Tiger Sugar',  ts: `${currentPrefix}-12T14:30:00` },
    { id: 'pi2', amount: 12000,  name: 'Cước gửi xe buổi tối', ts: `${currentPrefix}-12T08:15:00` },
    { id: 'pi3', amount: 180000, name: 'Tiền điện chưa rõ',    ts: `${currentPrefix}-11T18:00:00` },
  ],

  savingsGoals: [
    { id: 'sg1', name: 'Mua xe máy SH',          target: 30000000, saved: 12500000, deadline: `${currentYear}-12-31`, color: '#7C3AED', emoji: '🏍' },
    { id: 'sg2', name: 'Du lịch Đà Nẵng',         target: 8000000,  saved: 5600000,  deadline: `${currentYear}-08-01`, color: '#0891B2', emoji: '🏖' },
    { id: 'sg3', name: 'Quỹ khẩn cấp 3 tháng',    target: 15000000, saved: 3000000,  deadline: null,         color: '#059669', emoji: '🛡' },
  ],
};

/* ── Computed Fund Stats ──────────────────────────────────────────────────── */
const _allIncome  = MOCK_DATA.transactions.filter(t => t.type === 'income').reduce((s, t)  => s + t.amount, 0);
const _allExpense = MOCK_DATA.transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
MOCK_DATA.stats = {
  balance:        MOCK_DATA.fundAccount.initialBalance + _allIncome - _allExpense,
  totalIncome:    _allIncome,
  totalExpense:   _allExpense,
  openingBalance: MOCK_DATA.fundAccount.initialBalance,
};

/* ── Member Payment Data ─────────────────────────────────────────────────── */
MOCK_DATA.members.forEach(m => {
  const paid = MOCK_DATA.transactions.filter(t => t.type === 'income' && t.memberId === m.id).reduce((s, t) => s + t.amount, 0);
  const due  = m.monthlyDue * 10;
  m.totalPaid = paid; m.totalDue = due;
  m.status = paid >= due ? 'paid' : paid > 0 ? 'partial' : 'unpaid';
});

/* ── Utils ───────────────────────────────────────────────────────────────── */
export function formatVND(amount) {
  if (!amount && amount !== 0) return '0 đ';
  const abs = Math.abs(amount);
  if (abs >= 1000000) {
    const m = abs / 1000000;
    return (amount < 0 ? '-' : '') + (m % 1 === 0 ? m.toFixed(0) : m.toFixed(1)) + ' tr đ';
  }
  return new Intl.NumberFormat('vi-VN').format(amount) + ' đ';
}
function formatVNDFull(amount) { return new Intl.NumberFormat('vi-VN').format(amount || 0) + ' đ'; }
function formatDate(dateStr, short) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  return short
    ? d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })
    : d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}
function formatTS(tsStr) {
  if (!tsStr) return '';
  const d = new Date(tsStr);
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }) + ' ' + d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
}
function getCatById(id)    { return MOCK_DATA.categories.find(c => c.id === id); }
function getMemberById(id) { return MOCK_DATA.members.find(m => m.id === id); }
function getPCatById(id)   { return MOCK_DATA.personalCategories.find(c => c.id === id); }
function getWalletById(id) { return MOCK_DATA.personalWallets.find(w => w.id === id); }
function getMonthIncome(p)  { return MOCK_DATA.transactions.filter(t => t.type === 'income'  && t.date.startsWith(p)).reduce((s, t) => s + t.amount, 0); }
function getMonthExpense(p) { return MOCK_DATA.transactions.filter(t => t.type === 'expense' && t.date.startsWith(p)).reduce((s, t) => s + t.amount, 0); }

export { formatVNDFull, formatDate, formatTS, getCatById, getMemberById, getPCatById, getWalletById, getMonthIncome, getMonthExpense };

/* ── Local Storage Persistence ───────────────────────────────────────────── */
const STORAGE_KEY = 'SmartMoney_LocalData';

export function loadFromLocal() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Merge all top-level keys into MOCK_DATA
      Object.keys(parsed).forEach(key => {
        if (MOCK_DATA.hasOwnProperty(key)) {
          MOCK_DATA[key] = parsed[key];
        }
      });
      console.log('✅ Loaded user data from LocalStorage');
    }
  } catch (e) {
    console.error('Failed to load local data', e);
  }
}

export function saveToLocal() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(MOCK_DATA));
  } catch (e) {
    console.error('Failed to save local data', e);
  }
}

// Auto-load on initialization
loadFromLocal();

export { saveToLocal };
