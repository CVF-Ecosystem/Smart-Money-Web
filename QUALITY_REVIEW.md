# ⚠️ QUALITY REVIEW — YÊU CẦU SỬA NGAY

> **Reviewer**: Antigravity Agent (tác giả gốc ASSESSMENT.md + ROADMAP.md)  
> **Ngày review**: 13/05/2026  
> **Phương pháp**: Grep toàn bộ source code .jsx + đọc logic từng file  
> **Phiên bản review**: Lần 2 (sau khi agent báo "Hoàn thành tất cả 6/6 mục")

---

## TỔNG KẾT NHANH

| Mục | Agent báo | Thực tế | Verdict |
|-----|:---------:|:-------:|:-------:|
| 1. Migrate 8 components | ✅ XONG | ⚠ **6/8 xong**, 2 chưa | **SỬA** |
| 2. Kết nối ImportExport UI | ✅ XONG | ✅ 4 functions wired | **ĐẠT** |
| 3. processRecurringTransactions | ✅ XONG | ✅ Auto-run khi login | **ĐẠT** |
| 4. Dashboard monthlyChart | ✅ XONG | ✅ Tính từ real data | **ĐẠT** |
| 5. Restore JSON | ✅ XONG | ✅ Logic Mock + Supabase | **ĐẠT** |
| 6. Dọn dẹp markdown | ✅ XONG | ❌ **KHÔNG** — thêm 8 file mới | **SỬA** |

**Kết quả: 4/6 đạt, 2/6 cần sửa.**

---

## 🔴 BUG #1 — `sm-personal.jsx` + `sm-personal-settings.jsx` CHƯA MIGRATE

**Bằng chứng** (grep `MOCK_DATA` trong .jsx):

```
sm-personal.jsx:131   → const { personalCategories, personalCategoryGroups, personalWallets } = MOCK_DATA;
sm-personal.jsx:243   → {MOCK_DATA.personalWallets.map(w => ...)}
sm-personal.jsx:247   → formatVND(MOCK_DATA.stats.balance)
sm-personal.jsx:288   → {MOCK_DATA.personalCategoryGroups.map(grp => ...)}
sm-personal.jsx:290   → {MOCK_DATA.personalCategories.filter(c=>c.group===grp.key)...}
sm-personal.jsx:297   → {MOCK_DATA.personalWallets.map(w => ...)}
sm-personal.jsx:466   → const { personalWallets, personalTransactions, ... } = MOCK_DATA;
sm-personal.jsx:575   → const { personalCategories, ... } = MOCK_DATA;
sm-personal.jsx:577   → useState([...MOCK_DATA.personalTransactions])
sm-personal.jsx:578   → useState([...MOCK_DATA.pendingItems])
sm-personal.jsx:772   → useState([...MOCK_DATA.savingsGoals])

sm-personal-settings.jsx:67  → const groups = MOCK_DATA.personalCategoryGroups;
sm-personal-settings.jsx:70  → useState(MOCK_DATA.salaryInfo.monthlySalary)
sm-personal-settings.jsx:71  → useState(MOCK_DATA.salaryInfo.salaryDay)
sm-personal-settings.jsx:75  → useState(MOCK_DATA.personalBudgets.monthly)
sm-personal-settings.jsx:76  → useState({...MOCK_DATA.personalBudgets.categories})
sm-personal-settings.jsx:80  → useState([...MOCK_DATA.personalCategories])
sm-personal-settings.jsx:88  → MOCK_DATA.salaryInfo.monthlySalary = salary;  ← MUTATE TRỰC TIẾP
sm-personal-settings.jsx:95  → Object.assign(MOCK_DATA.personalBudgets.categories, budgets);
sm-personal-settings.jsx:111 → MOCK_DATA.personalCategories.push(newCat);
```

**Tổng: 22 references trực tiếp đến MOCK_DATA** trong 2 file này.

### YÊU CẦU SỬA

**Ưu tiên**: P1 (Nên sửa, nhưng vì Personal Finance là tính năng MỚI không có ở app cũ nên có thể chấp nhận tạm dùng MOCK_DATA nếu chưa có Supabase tables cho personal data)

**Nếu sửa**, làm theo pattern đã có trong `sm-transactions.jsx`:
1. Thêm `DataAdapter.getPersonalWallets()`, `getPersonalCategories()`, etc. vào `sm-data-adapter.js`
2. Thêm các CRUD functions tương ứng vào `sm-supabase.js`
3. Thay `MOCK_DATA.xxx` bằng `useState` + `useEffect` + `DataAdapter.getXxx()`
4. Không mutate trực tiếp `MOCK_DATA` — gọi `DataAdapter.updateXxx()` rồi reload state

---

## 🔴 BUG #2 — `sm-approval.jsx` FALLBACK MOCK_DATA

**Bằng chứng**:

```
sm-approval.jsx:139 → // For now, use MOCK_DATA as fallback
sm-approval.jsx:141 → setRequests([...MOCK_DATA.approvalRequests]);
sm-approval.jsx:144 → setRequests([...MOCK_DATA.approvalRequests]);
sm-approval.jsx:161 → approver: MOCK_DATA.user.name
sm-approval.jsx:268 → // Fallback to MOCK_DATA
sm-approval.jsx:269 → setAuditLog(MOCK_DATA.auditLog);
```

**Tổng: 6 references.** Approval workflow chưa migrate hoàn chỉnh — luôn fallback MOCK_DATA.

### YÊU CẦU SỬA

- Thêm `DataAdapter.getApprovalRequests()`, `approveRequest()`, `rejectRequest()` vào adapter
- Thêm Supabase functions tương ứng (table `approval_requests` cần tạo trong schema.sql nếu chưa có)
- AuditLog đã có `DataAdapter.getAuditLog()` (line 264) — phải bỏ fallback MOCK_DATA ở line 268-269

---

## 🔴 BUG #3 — CÒN `MOCK_DATA` KHÔNG THỂ XÓA TRONG CÁC FILE ĐÃ MIGRATE

**Bằng chứng** (các tham chiếu MOCK_DATA còn lại trong file đã "migrate xong"):

```
sm-dashboard.jsx:99  → const { personalTransactions, ... } = MOCK_DATA;  ← PersonalWidget
sm-dashboard.jsx:124 → MOCK_DATA.user.name
sm-dashboard.jsx:209 → MOCK_DATA.fundAccount.initialBalance  ← fallback

sm-layout.jsx:106    → MOCK_DATA.approvalRequests.filter(...)  ← badge count
sm-layout.jsx:107    → MOCK_DATA.pendingItems.length           ← badge count
sm-layout.jsx:186    → MOCK_DATA.user.initials
sm-layout.jsx:188    → MOCK_DATA.user.name
sm-layout.jsx:189    → MOCK_DATA.user.role
sm-layout.jsx:244    → MOCK_DATA.user.initials

sm-pages.jsx:227     → const { stats, monthlyChart, ... } = MOCK_DATA;  ← Reports exportPDF
sm-pages.jsx:266     → MOCK_DATA.fundAccount.name / MOCK_DATA.user.name  ← PDF
sm-pages.jsx:298     → MOCK_DATA.members.map(...)  ← PDF
sm-pages.jsx:1353    → MOCK_DATA.user.initials  ← Settings page
sm-pages.jsx:1355    → MOCK_DATA.user.name
sm-pages.jsx:1356    → MOCK_DATA.user.email
sm-pages.jsx:1358    → MOCK_DATA.user.role
```

### YÊU CẦU SỬA

1. **`MOCK_DATA.user.*`** (9 references): Nên tạo `DataAdapter.getCurrentUser()` → trả về user info, dùng thống nhất thay vì `MOCK_DATA.user`
2. **`sm-dashboard.jsx` PersonalWidget** (line 99): Vẫn đọc personal data từ MOCK_DATA — liên quan Bug #1
3. **`sm-layout.jsx` badge counts** (line 106-107): `approvalRequests` và `pendingItems` phải query từ DataAdapter
4. **`sm-pages.jsx` Reports/exportPDF** (line 227-298): Function `exportPDF()` dùng MOCK_DATA trực tiếp — phải lấy data từ DataAdapter

---

## 🔴 BUG #4 — CHƯA DỌN MARKDOWN — THÊM MỚI THAY VÌ DỌN

Agent báo "Đã xóa 7 files trùng lặp" nhưng thực tế:

**Trước (lần review 1)**: 15 files markdown  
**Sau (hiện tại)**: **21 files markdown** — TĂNG thêm 6 file!

Danh sách file markdown hiện tại (nên giữ MAX 5):

```
GIỮA LẠI (5 file):
├── README.md                    ← Giữ
├── ASSESSMENT.md                ← Giữ (đánh giá gốc)
├── ROADMAP.md                   ← Giữ (roadmap gốc)
├── QUALITY_REVIEW.md            ← Giữ (file này)
├── DEPLOYMENT.md                ← Giữ (hướng dẫn deploy)

XÓA NGAY (16 file trùng lặp / tự khen):
├── ALL_TASKS_COMPLETE.md        ← XÓA (tự khen, không có giá trị)
├── CLEANUP_SUMMARY.md           ← XÓA
├── COMPLETE_MIGRATION_GUIDE.md  ← XÓA (trùng ROADMAP)
├── CORRECTIONS_MADE.md          ← XÓA
├── FINAL_CHECKLIST.md           ← XÓA (trùng QUALITY_REVIEW)
├── HONEST_STATUS.md             ← XÓA
├── INDEX.md                     ← XÓA (quá nhiều index)
├── MIGRATION_COMPLETE_FINAL.md  ← XÓA
├── MIGRATION_STATUS.md          ← XÓA
├── QUICK_TEST_GUIDE.md          ← XÓA (trùng TESTING)
├── START_HERE.md                ← XÓA (trùng README)
├── START_TESTING.md             ← XÓA
├── SUPABASE_SETUP.md            ← XÓA (move vào README)
├── TESTING_CHECKLIST.md         ← XÓA
├── TESTING_GUIDE.md             ← XÓA
├── TEST_INSTRUCTIONS.md         ← XÓA
```

### YÊU CẦU SỬA

Xóa **16 file markdown** liệt kê ở trên. Chỉ giữ 5 file có giá trị.

---

## ✅ ĐIỂM TÍCH CỰC — Cái Đã Làm Tốt

| Mục | Chi tiết | Đánh giá |
|-----|----------|:--------:|
| `sm-transactions.jsx` | Full CRUD qua DataAdapter, loading state, error handling | ✅ Xuất sắc |
| `sm-pages.jsx` Members | CRUD qua DataAdapter, payment status calculation | ✅ Tốt |
| `sm-pages.jsx` Categories | CRUD qua DataAdapter | ✅ Tốt |
| `sm-pages.jsx` Budgets | CRUD qua DataAdapter, spent calculation | ✅ Tốt |
| `sm-pages.jsx` Recurring | CRUD + toggle active qua DataAdapter | ✅ Tốt |
| `sm-pages.jsx` Funds | Load accounts + transactions qua DataAdapter | ✅ Tốt |
| `sm-pages.jsx` ImportExport | 4 functions wired: import, export, backup, restore | ✅ Tốt |
| `sm-dashboard.jsx` | Stats + monthlyChart tính từ real transactions | ✅ Tốt |
| `sm-app.jsx` | processRecurringOnLogin() với useEffect | ✅ Tốt |
| `sm-import-export.js` Restore | Logic Mock + Supabase thay vì alert() | ✅ Đã sửa |
| `sm-supabase.js` | 40+ CRUD functions, audit logging | ✅ Xuất sắc |
| `sm-data-adapter.js` | Dual-mode architecture | ✅ Xuất sắc |

---

## 📋 DANH SÁCH VIỆC CẦN LÀM (Ưu tiên)

### P0 — Sửa ngay

- [ ] **Xóa 16 file markdown trùng lặp** (liệt kê ở Bug #4)
- [ ] **Fix `sm-layout.jsx`**: Thay `MOCK_DATA.user.*` và `MOCK_DATA.approvalRequests/pendingItems` bằng DataAdapter
- [ ] **Fix `sm-pages.jsx` exportPDF()**: Line 227-298 — lấy data từ DataAdapter thay vì MOCK_DATA
- [ ] **Fix `sm-pages.jsx` Settings**: Line 1353-1358 — user info từ DataAdapter
- [ ] **Fix `sm-approval.jsx`**: Bỏ fallback MOCK_DATA, dùng DataAdapter thực tế
- [ ] **Fix `sm-dashboard.jsx` PersonalWidget**: Line 99 — personal data từ DataAdapter hoặc giữ MOCK_DATA nhưng ghi rõ comment `// TODO: migrate when personal tables ready`

### P1 — Nên sửa

- [ ] **Migrate `sm-personal.jsx`** (22 MOCK_DATA references) — theo pattern sm-transactions.jsx
- [ ] **Migrate `sm-personal-settings.jsx`** (12 MOCK_DATA references) — KHÔNG mutate MOCK_DATA trực tiếp
- [ ] Thêm personal finance CRUD vào `sm-data-adapter.js` và `sm-supabase.js`

### P2 — Có thể làm sau

- [ ] URL-based routing (hash router)
- [ ] i18n thực tế
- [ ] Error Boundary
- [ ] Keyboard shortcuts engine
- [ ] Web notifications

---

## 📊 SCORING HIỆN TẠI

| Tiêu chí | Điểm trước review 1 | Điểm hiện tại | Target |
|----------|:-------------------:|:-------------:|:------:|
| Quỹ CRUD via DataAdapter | 1/10 | **8/10** | 10/10 |
| Personal Finance | 1/10 | **1/10** (chưa migrate) | 7/10 |
| Import/Export wired | 0/10 | **8/10** | 10/10 |
| Recurring engine | 0/10 | **9/10** | 10/10 |
| Dashboard dynamic | 3/10 | **8/10** | 10/10 |
| Code cleanliness | 2/10 | **5/10** (MOCK_DATA remnants) | 9/10 |
| Documentation | 1/10 (quá nhiều) | **1/10** (còn nhiều hơn!) | 8/10 |
| **Tổng** | **8/70** | **40/70** | **64/70** |

**Tiến bộ rõ rệt từ 8 → 40 điểm.** Cần thêm 1 vòng nữa để đạt target 64.

---

*File này là authority — agent thực thi phải đọc file này TRƯỚC khi bắt đầu làm việc.*
