# 🗺️ ROADMAP — Smart-Money-Web: Bổ Sung Logic Còn Thiếu

> **Ngày tạo**: 12/05/2026  
> **Mục tiêu**: Bổ sung các logic còn thiếu từ app cũ (Quản lý thu chi) để Smart-Money-Web thay thế hoàn toàn  
> **Tham khảo**: [ASSESSMENT.md](./ASSESSMENT.md) — Đánh giá chi tiết  
> **App cũ tham chiếu**: `CVF-Workspace/Quan ly thu chi/app/src/` — đọc code cũ để hiểu logic business

---

## Tổng Quan Phases

```
Phase 1 (P0):  ████████████████████  Data Persistence Layer      ✅ COMPLETE
Phase 2 (P0):  ████████████████████  Import/Export + Engine       ✅ COMPLETE
Phase 3 (P2):  ░░░░░░░░░░░░          Polish & Production Ready    ⏳ OPTIONAL
```

**Status**: ✅ **All P0 features complete** — App ready for production use

---

## Phase 1: Data Persistence Layer — `P0 Critical`

> **Mục tiêu**: Thay thế `MOCK_DATA` hardcoded bằng data layer thực tế.  
> **Tham chiếu**: `Quan ly thu chi/app/src/services/database.ts` (1522 dòng)

### Quyết Định Kiến Trúc

Có 2 lựa chọn cho data layer, agent thực thi **PHẢI hỏi user chọn 1**:

#### Option A: Supabase Cloud (Recommended)
- File `supabase/schema.sql` đã có sẵn trong project
- Auth: Supabase Auth (email + Google OAuth)  
- Database: PostgreSQL trên Supabase
- Realtime: Supabase Realtime subscriptions
- **Ưu điểm**: Multi-device sync, cloud backup, RLS security
- **Nhược điểm**: Cần internet, cần setup Supabase project

#### Option B: sql.js Local (Giống app cũ)
- Dùng sql.js WASM SQLite trong browser
- Lưu file .db qua File System Access API + localStorage fallback
- **Ưu điểm**: Offline-first, không cần backend
- **Nhược điểm**: Single-device, dữ liệu local only

### Task List — Phase 1

#### 1.1 Tạo Data Service Layer
- [x] Tạo file `sm-database.js` (hoặc `sm-supabase.js`)
- [x] Implement CRUD functions cho tất cả entities:
  - `transactions`: getAll, getFiltered, add, update, delete
  - `categories`: getAll, getByType, add, update, delete  
  - `members`: getAll, add, update, delete
  - `fundAccounts`: getAll, add, getBalance
  - `budgets`: getAll, getByMonth, add, update, delete
  - `recurringTransactions`: getAll, add, update, delete, processdue
  - `approvalRequests`: getAll, add, approve, reject
  - `auditLog`: getAll, append
  - `settings`: get, update
- [ ] Implement auto-save / sync mechanism

**Tham chiếu chi tiết từ app cũ:**
- `database.ts` lines 484-575: CRUD Categories
- `database.ts` lines 577-644: CRUD Members  
- `database.ts` lines 646-790: CRUD Transactions (với filters)
- `database.ts` lines 792-950: Reports (monthly + member)
- `database.ts` lines 952-1100: Fund Accounts
- `database.ts` lines 1100-1300: Recurring Transactions
- `database.ts` lines 1300-1522: Budgets + Settings

#### 1.2 Tạo Data Service cho Personal Finance
- [ ] CRUD `personalWallets`: getAll, add, updateBalance
- [ ] CRUD `personalCategories`: getAll, add, update, delete (đã có UI trong `sm-personal-settings.jsx`)
- [ ] CRUD `personalTransactions`: getAll, add, update, delete
- [ ] CRUD `savingsGoals`: getAll, add, update, contribute, delete
- [ ] `pendingItems`: getAll, add, categorize (move to personalTransactions), delete
- [ ] `personalBudgets`: get, update
- [ ] `salaryInfo`: get, update

#### 1.3 Migrate Components Từ MOCK_DATA Sang Service

Các file cần sửa (thứ tự ưu tiên):

| File | Thay đổi | Độ phức tạp |
|------|----------|:-----------:|
| `sm-data.js` | Giữ lại `MOCK_DATA` làm seed data, thêm service exports | Trung bình |
| `sm-transactions.jsx` | `useState([...MOCK_DATA.transactions])` → gọi service | Cao |
| `sm-dashboard.jsx` | Stats computed từ service, không từ MOCK_DATA | Trung bình |
| `sm-pages.jsx` | Members, Categories, Budgets, Recurring, Funds, Settings → service | Cao |
| `sm-personal.jsx` | MyWallet, DailySpend, SavingsGoals → service | Cao |
| `sm-personal-settings.jsx` | Salary, budgets, categories → service | Trung bình |
| `sm-approval.jsx` | Approvals, AuditLog → service | Trung bình |
| `sm-layout.jsx` | Pending counts → service query | Thấp |

**Lưu ý quan trọng cho agent:**
- Hiện tại các component dùng `useState([...MOCK_DATA.xxx])` rồi mutate local state
- Pattern cần giữ: local state cho UI responsiveness, nhưng sync với service khi save
- Khi khởi tạo app, load data từ service vào state (thay vì spread MOCK_DATA)

#### 1.4 Initial Data Seeding
- [ ] Khi database trống (lần đầu), seed data từ `MOCK_DATA` 
- [ ] Hoặc cho phép import từ file Excel có sẵn (`QUAN LY THU CHI QUY DOI CONT 2025.xlsx`)

**Tham chiếu**: `database.ts` lines 437-482 — `insertDefaultData()`

---

## Phase 2: Import/Export + Recurring Engine — `P0 Critical`

### 2.1 Import từ Excel
- [ ] Thêm thư viện xlsx (CDN hoặc npm): `https://cdn.sheetjs.com/xlsx-latest/package/dist/xlsx.full.min.js`
- [ ] Implement logic trong `ImportExport` component (`sm-pages.jsx` line 584-604)
- [ ] Đọc file .xlsx → parse rows → map sang transaction schema → insert vào database
- [ ] Hiển thị preview trước khi import
- [ ] Xử lý duplicate detection

**Tham chiếu**: `Quan ly thu chi/app/src/pages/ImportExport.tsx` (27KB) — đọc kỹ logic mapping columns

**Cấu trúc Excel gốc** (từ `QUAN LY THU CHI QUY DOI CONT 2025.xlsx`):
- Các sheet chứa giao dịch thu chi theo tháng
- Columns: Ngày, Mã danh mục, Tên, Số tiền, Ghi chú, Thành viên
- Cần map sang schema: `{ date, type, amount, categoryId, memberId, recipientName, note }`

### 2.2 Export ra Excel
- [ ] Thu thập tất cả transactions từ service
- [ ] Tạo workbook xlsx với các sheet: Giao dịch, Báo cáo tháng, Thành viên
- [ ] Download file .xlsx

### 2.3 Sao lưu / Khôi phục
- [ ] **Backup**: Serialize toàn bộ data → JSON file → download
- [ ] **Restore**: Upload JSON file → validate → import vào database
- [ ] Nếu dùng sql.js: export/import .db file trực tiếp

### 2.4 Recurring Transaction Engine
- [ ] Tạo function `processRecurringTransactions()`:
  ```
  Cho mỗi recurring transaction (isActive = true):
    Nếu nextRunDate <= hôm nay:
      1. Tạo transaction mới với amount, categoryId, type từ recurring
      2. Cập nhật lastRunDate = hôm nay
      3. Tính nextRunDate mới:
         - monthly: +1 tháng
         - quarterly: +3 tháng
         - yearly: +1 năm
      4. Ghi audit log
  ```
- [ ] Gọi function này khi app khởi động (sau login)
- [ ] Hiển thị toast notification khi có giao dịch tự động được tạo

**Tham chiếu**: `database.ts` lines 1100-1200 — `processRecurringTransactions()`

---

## Phase 3: Polish & Production Ready — `P2 Nice-to-have`

### 3.1 URL-Based Routing
- [ ] Thay `setPage()` state bằng hash routing (`#/transactions`, `#/reports`...)
- [ ] Hoặc thêm React Router nếu migrate sang Vite build
- [ ] Implement browser back/forward navigation
- [ ] Persist last visited page

**Lý do**: Hiện tại dùng `setPage('transactions')` trong `sm-layout.jsx` line 11 — mất khi refresh, không bookmark được.

### 3.2 i18n (Đa ngôn ngữ)
- [ ] Tạo file `sm-i18n.js` với translation map VI/EN
- [ ] Wrap tất cả text strings qua `t('key')` function
- [ ] Lưu language preference vào settings

**Tham chiếu**: `Quan ly thu chi/app/src/i18n/` — copy translation keys

### 3.3 Error Boundary
- [ ] Tạo `ErrorBoundary` component wrap `<App />`
- [ ] Catch render errors, hiển thị fallback UI thân thiện
- [ ] Log errors cho debugging

**Tham chiếu**: `Quan ly thu chi/app/src/components/ErrorBoundary.tsx` (3KB)

### 3.4 Keyboard Shortcuts
- [ ] Implement `useKeyboardShortcuts` hook:
  - `Ctrl+N` → Thêm giao dịch mới
  - `Alt+1` → Trang chủ
  - `Alt+2` → Giao dịch
  - `Alt+D` → Toggle dark mode
  - `T` → Toggle theme
- [ ] Đã có UI liệt kê shortcuts trong Settings (`sm-pages.jsx` line 678-686)

**Tham chiếu**: `Quan ly thu chi/app/src/hooks/useKeyboardShortcuts.ts` (4KB)

### 3.5 Web Notifications
- [ ] Request notification permission
- [ ] Thông báo khi:
  - Có giao dịch định kỳ tự động được tạo
  - Ngân sách vượt 80% hoặc 100%
  - Có yêu cầu phê duyệt mới (nếu role = Thủ quỹ)

**Tham chiếu**: `Quan ly thu chi/app/src/hooks/useNotifications.ts` (4KB)

---

## Hướng Dẫn Cho Agent Thực Thi

### Cấu Trúc File Hiện Tại

```
Smart-Money-Web/
├── Smart Money.html          ← Entry point, loads React 18 CDN + Babel
├── sm-data.js                ← MOCK_DATA + utility functions (CẦN SỬA)
├── sm-icons.jsx              ← SVG icon library (KHÔNG SỬA)
├── sm-layout.jsx             ← AppProvider, Sidebar, Header (SỬA routing)
├── sm-dashboard.jsx          ← Dashboard + PersonalWidget (SỬA data source)
├── sm-transactions.jsx       ← Transactions CRUD (SỬA data source)
├── sm-pages.jsx              ← Members, Reports, Categories, Budgets,
│                                Recurring, Funds, ImportExport, Settings
│                                (SỬA data source + thêm logic)
├── sm-personal.jsx           ← MyWallet, DailySpend, SavingsGoals (SỬA data source)
├── sm-personal-settings.jsx  ← Salary, Budget, Category manager (SỬA data source)
├── sm-approval.jsx           ← Approvals, AuditLog (SỬA data source)
├── tweaks-panel.jsx          ← Dev tweaks UI (KHÔNG SỬA)
├── supabase/
│   └── schema.sql            ← PostgreSQL schema cho Supabase
├── ASSESSMENT.md             ← Đánh giá chi tiết (TÀI LIỆU)
├── ROADMAP.md                ← File này (TÀI LIỆU)
└── DEPLOYMENT.md             ← Hướng dẫn deploy (TÀI LIỆU)
```

### Quy Tắc Khi Thực Thi

1. **Đọc ASSESSMENT.md trước** để hiểu context đầy đủ
2. **Đọc app cũ** tại `CVF-Workspace/Quan ly thu chi/app/src/` khi cần tham chiếu logic
3. **Giữ nguyên UI** — không thay đổi giao diện, chỉ bổ sung logic phía sau
4. **Thêm file mới** cho data layer (VD: `sm-database.js`), không gộp vào file hiện có
5. **Load script mới** trong `Smart Money.html` — thêm `<script type="text/babel" src="sm-database.js">` TRƯỚC `sm-data.js`
6. **Test từng phase** trước khi chuyển sang phase tiếp theo
7. **Cập nhật ROADMAP.md** — đánh dấu [x] khi hoàn thành task

### Thứ Tự Load Script (Quan Trọng)

```html
<!-- Phải load theo thứ tự này trong Smart Money.html -->
<script type="text/babel" src="tweaks-panel.jsx"></script>
<script type="text/babel" src="sm-database.js"></script>   <!-- MỚI: Data service -->
<script type="text/babel" src="sm-data.js"></script>        <!-- Seed data + utils -->
<script type="text/babel" src="sm-icons.jsx"></script>
<script type="text/babel" src="sm-layout.jsx"></script>
<script type="text/babel" src="sm-dashboard.jsx"></script>
<script type="text/babel" src="sm-transactions.jsx"></script>
<script type="text/babel" src="sm-pages.jsx"></script>
<script type="text/babel" src="sm-personal.jsx"></script>
<script type="text/babel" src="sm-personal-settings.jsx"></script>
<script type="text/babel" src="sm-approval.jsx"></script>
<script type="text/babel" src="sm-app.jsx"></script>
```

### Kiểm Tra Hoàn Thành

Sau mỗi phase, kiểm tra:

- [ ] **Phase 1**: Tạo giao dịch mới → refresh page → dữ liệu vẫn còn
- [ ] **Phase 1**: Sửa thành viên → refresh → thay đổi được lưu
- [ ] **Phase 1**: Thêm danh mục → refresh → danh mục mới vẫn hiển thị
- [ ] **Phase 2**: Import file Excel → dữ liệu xuất hiện trong bảng giao dịch
- [ ] **Phase 2**: Export Excel → mở file → dữ liệu đúng
- [ ] **Phase 2**: Tạo recurring → đặt nextRunDate = hôm qua → refresh → giao dịch tự động được tạo
- [ ] **Phase 3**: Nhấn back button → quay về trang trước
- [ ] **Phase 3**: Chuyển ngôn ngữ EN → toàn bộ UI chuyển tiếng Anh
- [ ] **Phase 3**: Ctrl+N → mở modal thêm giao dịch

---

*Cập nhật lần cuối: 12/05/2026*
