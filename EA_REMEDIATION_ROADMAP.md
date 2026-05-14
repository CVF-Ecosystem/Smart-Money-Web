# 🗺️ EA REMEDIATION ROADMAP — Smart-Money-Web

> **Ngày tạo**: 14/05/2026  
> **Mục tiêu**: Lộ trình khắc phục các technical debt (P0, P1, P2) được chỉ ra trong `EA_QUALITY_ASSESSMENT.md` để đưa ứng dụng từ giai đoạn *Alpha* lên *Production-ready*.  
> **Dành cho Agent**: File này là task list hành động trực tiếp. Hãy chọn một Phase/Task và thực thi một cách triệt để.

---

## 🎯 TỔNG QUAN ƯU TIÊN

```
🔴 Phase 1 (P0): Các lỗi chặn triển khai (Blockers) - Phải làm ngay
🟡 Phase 2 (P1): Các tính năng cần thiết cho Beta - Cần làm
🟢 Phase 3 (P2): Tối ưu hóa cho Production - Nên làm
```

---

## 🔴 PHASE 1 (P0) — SỬA LỖI BLOCKER (Must Fix)

Các lỗi này ảnh hưởng trực tiếp đến bảo mật, rò rỉ dữ liệu hoặc làm sập ứng dụng. Cần được thực thi trước tiên.

### 1. 🚨 Xử lý Security & Authentication
- [ ] **Bảo mật XSS trong `exportPDF`** (`sm-pages.jsx`):  
      Hàm `exportPDF` hiện tại dùng `document.write()` với data không được sanitize. Phải escape/sanitize các biến như `fundName`, `userName`, và dữ liệu giao dịch trước khi render ra raw HTML.
- [ ] **Auth Thực Sự (Session Validation)**:  
      Hàm `LoginScreen` đang dùng `setTimeout(() => onLogin(), 900)`. Cần kết nối với `SupabaseService.signIn()` hoặc ít nhất lưu lại trạng thái đăng nhập hợp lệ vào `sessionStorage/localStorage` và check mỗi lần reload page.

### 2. 🚨 Loại bỏ Hardcode (Logic & UI)
- [ ] **Hardcoded Dates**: Xóa bỏ các giá trị fix cứng `2026` hoặc `2026-05` (ví dụ trong `sm-dashboard.jsx` và `sm-pages.jsx`) và thay bằng logic lấy ngày tháng hiện tại (`new Date()`).
- [ ] **Dọn dẹp God-file**: Cấu trúc lại `sm-pages.jsx` (đang có 1,422 dòng). Không cần tách file nếu gặp khó khăn về kiến trúc CDN, nhưng PHẢI đảm bảo các components không dính líu chéo state quá mức.

### 3. 🚨 Xử lý Error Handling
- [ ] **Tạo Error Boundary**: Bọc `App` hoặc `PageContent` trong một React Error Boundary để bắt lỗi render, tránh tình trạng ứng dụng bị "màn hình trắng" (white screen of death).

---

## 🟡 PHASE 2 (P1) — MIGRATION & REFACTORING (Should Fix)

Giai đoạn này hoàn tất quá trình dọn dẹp `MOCK_DATA` ra khỏi UI. DataAdapter là nguồn chân lý duy nhất.

### 1. 🧹 Triệt để loại bỏ MOCK_DATA trong UI
- [ ] **`sm-layout.jsx`**: Thay thế 7 references `MOCK_DATA` bằng `DataAdapter.getCurrentUser()` và các hàm query badge (ví dụ: đếm số approval pending) từ DataAdapter.
- [ ] **`sm-personal.jsx` & `sm-personal-settings.jsx`**: Cấu trúc lại toàn bộ theo pattern của `sm-transactions.jsx` (Dùng `useState`, `useEffect` và gọi DataAdapter thay vì mutate `MOCK_DATA` trực tiếp).

### 2. 🗄 Cập nhật Database Schema
- [ ] **Thêm bảng cho Personal Finance & Approvals**: Bổ sung schema SQL (nếu dùng Supabase) cho:
      - `personal_wallets`
      - `personal_transactions`
      - `personal_budgets` / `personal_categories`
      - `approval_requests`
- [ ] **Migrate `sm-approval.jsx`**: Triển khai CRUD qua DataAdapter và xóa dòng code fallback về MOCK_DATA.

### 3. ✨ Cải thiện UX cơ bản
- [ ] **Toast Notifications**: Thay thế toàn bộ `alert()` và `confirm()` gốc của trình duyệt thành UI Toast Notification chuyên nghiệp.

---

## 🟢 PHASE 3 (P2) — PRODUCTION POLISH (Nice-to-have)

Đây là các cải tiến về hạ tầng giúp dự án dễ bảo trì và mở rộng trong tương lai. Có thể cân nhắc làm sau.

### 1. 🏗️ Kiến trúc & DevOps
- [ ] **Migrate sang Vite**: Chuyển đổi kiến trúc từ CDN (In-browser Babel transpilation) sang Node/Vite build để có Tree-shaking, Code Splitting, và Performance tốt hơn.
- [ ] **TypeScript**: Áp dụng TypeScript (nếu chuyển sang Vite) để đảm bảo type safety cho toàn bộ codebase.

### 2. 🗺️ Tính Năng Nâng Cao
- [ ] **URL Routing**: Cài đặt React Router (hoặc HashRouter tự code) để cho phép chia sẻ URL và sử dụng nút Back/Forward của trình duyệt.
- [ ] **Mobile Responsiveness**: Đảm bảo thanh Sidebar và các bảng hiển thị tốt trên màn hình nhỏ.
- [ ] **Automated Tests**: Viết Unit Tests cho DataAdapter và E2E tests cho luồng login/đăng ký giao dịch.

---

## 📝 HƯỚNG DẪN CHO AGENT (PROMPT LỆNH MẪU)

> Agent tiếp theo nên dùng các prompt mẫu sau để bắt đầu công việc:

**Prompt 1 (P0)**: *"Hãy thực thi Phase 1 (P0) trong EA_REMEDIATION_ROADMAP.md. Cụ thể, fix lỗi XSS trong exportPDF của sm-pages.jsx và cập nhật logic Auth để không còn dùng fake timeout."*

**Prompt 2 (P1)**: *"Hãy xử lý triệt để việc loại bỏ MOCK_DATA khỏi sm-layout.jsx và sm-approval.jsx như yêu cầu ở Phase 2 (P1) trong EA_REMEDIATION_ROADMAP.md."*

**Prompt 3 (P1)**: *"Hãy tạo Toast Notification system thay thế cho các alert()/confirm() trong toàn bộ project theo chuẩn UI hiện tại."*
