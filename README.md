# 💰 Smart Money — Finance Manager

> Modern web app for managing collective funds and personal finance

**Status**: 🟡 Phase 1 in progress (50% complete)  
**Tech Stack**: React 18 CDN + Supabase + Vanilla CSS  
**Database**: PostgreSQL (Supabase) + Mock Data fallback

---

## 🚀 Quick Start

### Option 1: Demo Mode (No Setup)

```bash
# Just open in browser
Smart Money.html
```

- Uses MOCK_DATA (in-memory)
- No database required
- Perfect for testing UI

### Option 2: Production Mode (With Supabase)

1. Follow setup guide: [`SUPABASE_SETUP.md`](./SUPABASE_SETUP.md)
2. Configure: `supabase-config.js`
3. Open: `Smart Money.html`

- Data persists after refresh
- Multi-device sync
- Cloud backup

---

## 📚 Documentation

| File | Purpose |
|------|---------|
| [`ASSESSMENT.md`](./ASSESSMENT.md) | So sánh với app cũ, đánh giá tính năng |
| [`ROADMAP.md`](./ROADMAP.md) | 3-phase implementation plan |
| [`SUPABASE_SETUP.md`](./SUPABASE_SETUP.md) | Step-by-step Supabase setup (8 steps) |
| [`TESTING_GUIDE.md`](./TESTING_GUIDE.md) | Test cases + console commands |
| [`PHASE1_PROGRESS.md`](./PHASE1_PROGRESS.md) | Current progress tracking |
| [`PHASE1_SUMMARY.md`](./PHASE1_SUMMARY.md) | What's been done so far |
| [`DEPLOYMENT.md`](./DEPLOYMENT.md) | Deploy to Netlify/Vercel |

---

## ✨ Features

### ✅ Implemented (Working Now)

#### Collective Fund Management
- ✅ **Transactions** — Add/Edit/Delete with filters
- ✅ **Categories** — Income/Expense categories
- ✅ **Members** — Member management
- ✅ **Dashboard** — Stats + charts (partial)
- ✅ **Reports** — Monthly + member reports
- ✅ **Budgets** — Category budgets
- ✅ **Recurring** — Recurring transactions
- ✅ **Fund Accounts** — Multiple funds

#### Personal Finance
- ✅ **My Wallet** — 3 wallet types (Cash, ATM, Credit)
- ✅ **Daily Spend** — Quick expense tracking
- ✅ **Savings Goals** — Heo đất (piggy bank)
- ✅ **Personal Settings** — Salary, budgets, categories

#### Approvals & Audit
- ✅ **Approval Requests** — Pending/Approved/Rejected
- ✅ **Audit Log** — Timeline of all changes

#### UI/UX
- ✅ **Dark/Light Theme** — Toggle in header
- ✅ **Responsive Design** — Mobile-friendly
- ✅ **Custom Charts** — SVG bar/donut charts
- ✅ **Modals** — Smooth animations
- ✅ **Tweaks Panel** — Dev customization

### 🟡 Partially Implemented

- 🟡 **Data Persistence** — Supabase service ready, 1/7 components migrated
- 🟡 **Authentication** — UI ready, not connected yet
- 🟡 **Import/Export** — UI ready, logic pending

### ⏳ Planned (Phase 2-3)

- ⏳ **Import Excel** — Import transactions from .xlsx
- ⏳ **Export Excel** — Export to .xlsx
- ⏳ **Backup/Restore** — JSON backup
- ⏳ **Recurring Auto-Process** — Auto-create transactions
- ⏳ **URL Routing** — Bookmarkable pages
- ⏳ **i18n** — Vietnamese/English
- ⏳ **Keyboard Shortcuts** — Ctrl+N, Alt+1, etc.
- ⏳ **Web Notifications** — Budget alerts

---

## 🏗️ Architecture

### Data Layer

```
┌─────────────────────────────────────────┐
│         Components (React)              │
│  sm-transactions.jsx, sm-dashboard.jsx  │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│       DataAdapter (Unified API)         │
│         sm-data-adapter.js              │
└─────────┬───────────────────┬───────────┘
          │                   │
          ▼                   ▼
┌──────────────────┐  ┌──────────────────┐
│ SupabaseService  │  │    MOCK_DATA     │
│ sm-supabase.js   │  │   sm-data.js     │
└────────┬─────────┘  └──────────────────┘
         │
         ▼
┌──────────────────┐
│  Supabase Cloud  │
│   PostgreSQL     │
└──────────────────┘
```

### File Structure

```
Smart-Money-Web/
├── Smart Money.html          # Entry point
├── sm-app.jsx                # Root component
├── sm-layout.jsx             # Sidebar + Header
├── sm-dashboard.jsx          # Dashboard page
├── sm-transactions.jsx       # Transactions page ✅ Migrated
├── sm-pages.jsx              # Other pages (Members, Reports, etc.)
├── sm-personal.jsx           # Personal finance pages
├── sm-personal-settings.jsx  # Personal settings
├── sm-approval.jsx           # Approvals + Audit log
├── sm-icons.jsx              # SVG icon library
├── sm-data.js                # MOCK_DATA + utils
├── sm-supabase.js            # Supabase service layer ✅ NEW
├── sm-data-adapter.js        # Unified data API ✅ NEW
├── supabase-config.js        # Supabase credentials (gitignored)
├── tweaks-panel.jsx          # Dev tweaks UI
└── supabase/
    └── schema.sql            # PostgreSQL schema
```

---

## 🔧 Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 18 (CDN) + Babel Standalone |
| **Styling** | Vanilla CSS + CSS Custom Properties |
| **Database** | PostgreSQL (Supabase) |
| **Auth** | Supabase Auth (Email + Google OAuth) |
| **Storage** | Supabase Storage (for attachments) |
| **Hosting** | Netlify / Vercel (static) |
| **Build** | None (CDN-based, no build step) |

### Why CDN React?

- ✅ Zero build step
- ✅ Instant reload
- ✅ Easy to understand
- ✅ Perfect for prototyping
- ⚠️ Not optimized for production (can migrate to Vite later)

---

## 📊 Progress

### Phase 1: Data Persistence (50% complete)

- [x] ✅ Supabase service layer (1,100 lines)
- [x] ✅ Data adapter (500 lines)
- [x] ✅ Migrate Transactions page
- [ ] ⏳ Migrate Dashboard page
- [ ] ⏳ Migrate other pages (5 remaining)

### Phase 2: Import/Export + Recurring (0% complete)

- [ ] ⏳ Import Excel logic
- [ ] ⏳ Export Excel logic
- [ ] ⏳ Backup/Restore
- [ ] ⏳ Recurring auto-process

### Phase 3: Polish (0% complete)

- [ ] ⏳ URL routing
- [ ] ⏳ i18n
- [ ] ⏳ Error boundary
- [ ] ⏳ Keyboard shortcuts
- [ ] ⏳ Web notifications

---

## 🧪 Testing

### Manual Testing

See [`TESTING_GUIDE.md`](./TESTING_GUIDE.md) for:
- ✅ 6 test cases for Transactions
- ✅ Console commands
- ✅ Common issues & solutions

### Quick Test

```javascript
// Open DevTools Console (F12)

// Check mode
console.log('Mode:', DataAdapter.isSupabaseMode() ? 'Supabase' : 'Mock');

// Test CRUD
const txs = await DataAdapter.getTransactions();
console.log('Transactions:', txs);
```

---

## 🚢 Deployment

See [`DEPLOYMENT.md`](./DEPLOYMENT.md) for:
- Netlify deployment
- Vercel deployment
- Environment variables
- Custom domain

---

## 🤝 Contributing

### To Continue Development

1. Read [`PHASE1_PROGRESS.md`](./PHASE1_PROGRESS.md) for current status
2. Pick next component from priority list
3. Follow pattern from `sm-transactions.jsx`:
   - Add `useEffect` to load data
   - Replace `MOCK_DATA` with `DataAdapter`
   - Add loading + error states
4. Test with [`TESTING_GUIDE.md`](./TESTING_GUIDE.md)
5. Update progress docs

### Code Style

- Use React hooks (useState, useEffect, useMemo)
- Keep components in single files
- Use inline styles (no CSS modules)
- Follow existing naming conventions
- Add comments for complex logic

---

## 📝 License

Private project — Not for public distribution

---

## 🙏 Credits

- **Original App**: Quản lý thu chi (React 19 + TypeScript + Vite)
- **Design System**: Custom CSS with design tokens
- **Icons**: Custom SVG icon library
- **Database**: Supabase (PostgreSQL + Auth + Storage)

---

## 📞 Support

For questions or issues:
1. Check documentation files above
2. Check [`TESTING_GUIDE.md`](./TESTING_GUIDE.md) for common issues
3. Check browser console for errors

---

**Last Updated**: 12/05/2026  
**Version**: 1.0.0-alpha (Phase 1 in progress)
