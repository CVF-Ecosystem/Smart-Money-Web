# 🚀 Hướng dẫn Triển khai Smart Money
## Netlify (Frontend) + Supabase (Backend)

---

## 📐 Kiến trúc tổng thể

```
┌─────────────────────────────────────────────────────────┐
│                    NGƯỜI DÙNG (Browser)                  │
└───────────────────────┬─────────────────────────────────┘
                        │ HTTPS
┌───────────────────────▼─────────────────────────────────┐
│              NETLIFY (Frontend)                          │
│  React + Vite + TypeScript                               │
│  - Static site hosting (CDN toàn cầu)                   │
│  - Netlify Functions (nếu cần Edge logic)                │
│  - Environment variables (.env)                          │
└───────────────────────┬─────────────────────────────────┘
                        │ Supabase JS Client
┌───────────────────────▼─────────────────────────────────┐
│              SUPABASE (Backend)                          │
│  ┌─────────────────┐  ┌──────────────────────────────┐  │
│  │  Auth           │  │  PostgreSQL Database         │  │
│  │  - Email/Pass   │  │  - organizations             │  │
│  │  - Google OAuth │  │  - profiles                  │  │
│  │  - Magic Link   │  │  - transactions              │  │
│  └─────────────────┘  │  - categories, members...    │  │
│                        │  - RLS policies              │  │
│  ┌─────────────────┐  └──────────────────────────────┘  │
│  │  Storage        │  ┌──────────────────────────────┐  │
│  │  - attachments/ │  │  Edge Functions              │  │
│  │  - avatars/     │  │  - process-recurring         │  │
│  └─────────────────┘  │  - send-notifications        │  │
│                        └──────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

---

## 1️⃣ Thiết lập Supabase

### Bước 1: Tạo project Supabase
1. Vào [supabase.com](https://supabase.com) → **New Project**
2. Chọn region gần nhất (Singapore cho Việt Nam)
3. Lưu lại: `Project URL` và `anon public key`

### Bước 2: Chạy schema
```sql
-- Vào Supabase Dashboard → SQL Editor → New query
-- Copy toàn bộ nội dung file: supabase/schema.sql
-- Nhấn "Run"
```

### Bước 3: Cấu hình Auth
```
Dashboard → Authentication → Providers:
  ✅ Email (bật "Confirm email" nếu cần)
  ✅ Google OAuth (cần Google Cloud Console credentials)

Dashboard → Authentication → URL Configuration:
  Site URL: https://your-app.netlify.app
  Redirect URLs: https://your-app.netlify.app/**
```

### Bước 4: Tạo Storage bucket
```sql
-- SQL Editor
INSERT INTO storage.buckets (id, name, public)
VALUES ('attachments', 'attachments', false);

-- Policy cho attachments
CREATE POLICY "auth_upload" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'attachments' AND auth.role() = 'authenticated');

CREATE POLICY "org_access" ON storage.objects
  FOR SELECT USING (bucket_id = 'attachments' AND auth.role() = 'authenticated');
```

---

## 2️⃣ Cấu trúc Frontend (React + Vite)

```
smart-money-web/
├── src/
│   ├── lib/
│   │   └── supabase.ts          # Supabase client
│   ├── hooks/
│   │   ├── useTransactions.ts   # React Query hooks
│   │   ├── useMembers.ts
│   │   └── useAuth.ts
│   ├── pages/
│   │   ├── Dashboard.tsx
│   │   ├── Transactions.tsx
│   │   └── ...
│   └── App.tsx
├── .env.local                   # Biến môi trường local
├── .env.production              # Biến môi trường production
└── vite.config.ts
```

### `src/lib/supabase.ts`
```typescript
import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'  // generate bằng supabase gen types

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)
```

### `.env.local`
```env
VITE_SUPABASE_URL=https://xxxxxxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Ví dụ hook với React Query
```typescript
// hooks/useTransactions.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

export function useTransactions(filters?: { month?: string; type?: string }) {
  return useQuery({
    queryKey: ['transactions', filters],
    queryFn: async () => {
      let query = supabase
        .from('transactions')
        .select(`*, categories(*), members(*)`)
        .order('date', { ascending: false })

      if (filters?.type && filters.type !== 'all')
        query = query.eq('type', filters.type)
      if (filters?.month)
        query = query.gte('date', filters.month + '-01').lte('date', filters.month + '-31')

      const { data, error } = await query
      if (error) throw error
      return data
    }
  })
}

export function useAddTransaction() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (tx: TransactionInsert) => {
      const { data, error } = await supabase.from('transactions').insert(tx).select().single()
      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['transactions'] })
  })
}
```

---

## 3️⃣ Packages cần thêm vào

```bash
npm install @supabase/supabase-js        # Supabase client
npm install @tanstack/react-query        # Data fetching / cache
npm install @tanstack/react-query-devtools
npm install react-hook-form zod          # Form validation
npm install recharts                     # Charts (giữ lại)
npm install xlsx                         # Import/Export Excel
npm install date-fns                     # Date utilities
npm install zustand                      # Global state (optional)
```

---

## 4️⃣ Triển khai lên Netlify

### Option A: Connect GitHub (Khuyến nghị)
```
1. Push code lên GitHub repository
2. Netlify Dashboard → "Add new site" → "Import from GitHub"
3. Chọn repo smart-money-web
4. Build settings:
   - Build command: npm run build
   - Publish directory: dist
5. Environment variables:
   - VITE_SUPABASE_URL = <your-url>
   - VITE_SUPABASE_ANON_KEY = <your-anon-key>
6. Deploy!
```

### Option B: Netlify CLI
```bash
npm install -g netlify-cli
netlify login
netlify init
netlify env:set VITE_SUPABASE_URL "https://xxx.supabase.co"
netlify env:set VITE_SUPABASE_ANON_KEY "eyJ..."
npm run build
netlify deploy --prod --dir=dist
```

### `netlify.toml`
```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[context.production.environment]
  NODE_VERSION = "20"
```

---

## 5️⃣ Edge Function: Xử lý giao dịch định kỳ

```typescript
// supabase/functions/process-recurring/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  const today = new Date().toISOString().split('T')[0]

  // Lấy các giao dịch định kỳ đến hạn
  const { data: due } = await supabase
    .from('recurring_transactions')
    .select('*')
    .eq('is_active', true)
    .lte('next_run_date', today)

  let processed = 0
  for (const r of due ?? []) {
    // Tạo giao dịch mới
    await supabase.from('transactions').insert({
      organization_id: r.organization_id,
      date: r.next_run_date,
      type: r.type,
      amount: r.amount,
      category_id: r.category_id,
      member_id: r.member_id,
      note: `Tự động: ${r.name}`,
    })

    // Cập nhật ngày chạy tiếp theo
    const nextDate = calcNextDate(r.next_run_date, r.frequency)
    await supabase.from('recurring_transactions')
      .update({ last_run_date: r.next_run_date, next_run_date: nextDate })
      .eq('id', r.id)

    processed++
  }

  return new Response(JSON.stringify({ processed }), {
    headers: { 'Content-Type': 'application/json' }
  })
})

function calcNextDate(current: string, freq: string): string {
  const d = new Date(current)
  if (freq === 'monthly')   d.setMonth(d.getMonth() + 1)
  if (freq === 'quarterly') d.setMonth(d.getMonth() + 3)
  if (freq === 'yearly')    d.setFullYear(d.getFullYear() + 1)
  return d.toISOString().split('T')[0]
}
```

### Kích hoạt Edge Function tự động (pg_cron)
```sql
-- Dashboard → Database → Extensions → pg_cron
SELECT cron.schedule(
  'process-recurring-daily',
  '0 7 * * *',  -- Chạy lúc 7h sáng mỗi ngày
  $$SELECT net.http_post(
    url := current_setting('app.settings.edge_function_url') || '/process-recurring',
    headers := '{"Authorization": "Bearer " || current_setting("app.settings.service_role_key")}'::jsonb
  )$$
);
```

---

## 6️⃣ Generate TypeScript types từ Supabase

```bash
npx supabase gen types typescript \
  --project-id YOUR_PROJECT_ID \
  --schema public \
  > src/lib/database.types.ts
```

---

## 7️⃣ Checklist trước khi Go Live

- [ ] Kiểm tra tất cả RLS policies đã bật
- [ ] Test đăng nhập / đăng ký
- [ ] Test CRUD transactions với nhiều user
- [ ] Xác nhận data isolation giữa các organizations
- [ ] Backup strategy (pg_dump hoặc Supabase built-in)
- [ ] Custom domain trên Netlify
- [ ] CORS settings trên Supabase (chỉ cho phép domain của bạn)
- [ ] Rate limiting (Supabase Auth + Netlify)
- [ ] Error monitoring (Sentry hoặc LogRocket)

---

## 📞 Support

- Supabase docs: https://supabase.com/docs
- Netlify docs: https://docs.netlify.com
- React Query: https://tanstack.com/query/latest
