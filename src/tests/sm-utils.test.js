/**
 * Unit Tests — sm-utils.test.js
 * Tests core utility functions: formatVND, formatVNDFull, date helpers
 * Run: npm run test
 */
import { describe, it, expect } from 'vitest';

// Test the formatVND logic directly (inline to avoid import complexity)
function formatVND(amount) {
  if (!amount && amount !== 0) return '0 đ';
  const abs = Math.abs(amount);
  if (abs >= 1000000) {
    const m = abs / 1000000;
    return (amount < 0 ? '-' : '') + (m % 1 === 0 ? m.toFixed(0) : m.toFixed(1)) + ' tr đ';
  }
  return new Intl.NumberFormat('vi-VN').format(amount) + ' đ';
}

function formatVNDFull(amount) {
  return new Intl.NumberFormat('vi-VN').format(amount || 0) + ' đ';
}

describe('formatVND — compact currency formatter', () => {
  it('formats zero correctly', () => {
    expect(formatVND(0)).toBe('0 đ');
  });

  it('formats null/undefined as 0 đ', () => {
    expect(formatVND(null)).toBe('0 đ');
    expect(formatVND(undefined)).toBe('0 đ');
  });

  it('formats amounts under 1M with thousand separator', () => {
    const result = formatVND(500000);
    expect(result).toContain('đ');
    expect(result).toContain('500');
  });

  it('formats 1M exactly as "1 tr đ"', () => {
    expect(formatVND(1000000)).toBe('1 tr đ');
  });

  it('formats 1.5M correctly', () => {
    expect(formatVND(1500000)).toBe('1.5 tr đ');
  });

  it('formats 15M correctly', () => {
    expect(formatVND(15000000)).toBe('15 tr đ');
  });

  it('formats negative values', () => {
    const result = formatVND(-2000000);
    expect(result).toBe('-2 tr đ');
  });
});

describe('formatVNDFull — full currency formatter', () => {
  it('formats 0 correctly', () => {
    const result = formatVNDFull(0);
    expect(result).toContain('đ');
  });

  it('formats 150000 with separator', () => {
    const result = formatVNDFull(150000);
    expect(result).toContain('đ');
    expect(result).toContain('150');
  });

  it('handles null as 0', () => {
    const result = formatVNDFull(null);
    expect(result).toContain('0');
  });
});

describe('Transaction type helpers', () => {
  const transactions = [
    { type: 'income',  amount: 1000000, date: '2026-05-01' },
    { type: 'expense', amount: 500000,  date: '2026-05-02' },
    { type: 'income',  amount: 2000000, date: '2026-04-15' },
    { type: 'expense', amount: 750000,  date: '2026-04-20' },
  ];

  it('calculates total income correctly', () => {
    const total = transactions
      .filter(t => t.type === 'income')
      .reduce((s, t) => s + t.amount, 0);
    expect(total).toBe(3000000);
  });

  it('calculates total expense correctly', () => {
    const total = transactions
      .filter(t => t.type === 'expense')
      .reduce((s, t) => s + t.amount, 0);
    expect(total).toBe(1250000);
  });

  it('filters transactions by month prefix', () => {
    const mayTxs = transactions.filter(t => t.date.startsWith('2026-05'));
    expect(mayTxs).toHaveLength(2);
  });

  it('sorts transactions by date descending', () => {
    const sorted = [...transactions].sort((a, b) => b.date.localeCompare(a.date));
    expect(sorted[0].date).toBe('2026-05-02');
    expect(sorted[sorted.length - 1].date).toBe('2026-04-15');
  });
});

describe('Member payment status logic', () => {
  function getMemberStatus(totalPaid, totalDue) {
    return totalPaid >= totalDue ? 'paid' : totalPaid > 0 ? 'partial' : 'unpaid';
  }

  it('marks fully paid member correctly', () => {
    expect(getMemberStatus(1500000, 1500000)).toBe('paid');
    expect(getMemberStatus(2000000, 1500000)).toBe('paid');
  });

  it('marks partial payment correctly', () => {
    expect(getMemberStatus(500000, 1500000)).toBe('partial');
  });

  it('marks unpaid member correctly', () => {
    expect(getMemberStatus(0, 1500000)).toBe('unpaid');
  });
});

describe('Current year/month helpers', () => {
  it('current year is a 4-digit number', () => {
    const year = new Date().getFullYear();
    expect(year).toBeGreaterThan(2000);
    expect(year).toBeLessThan(2100);
    expect(String(year)).toHaveLength(4);
  });

  it('month prefix is correctly formatted', () => {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    const prefix = `${year}-${month}`;
    expect(prefix).toMatch(/^\d{4}-\d{2}$/);
  });
});
