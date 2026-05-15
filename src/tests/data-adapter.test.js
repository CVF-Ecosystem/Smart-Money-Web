import { describe, it, expect, beforeEach, vi } from 'vitest';

// Force mock mode — must be top-level for Vitest hoisting
vi.mock('../sm-supabase.js', () => ({
  SupabaseService: { isSupabaseReady: () => false },
}));

import { DataAdapter } from '../sm-data-adapter.js';

beforeEach(() => {
  // No per-test reset needed; MOCK_DATA mutations accumulate across tests
  // which is fine for additive tests (each uses unique identifiers)
});

describe('DataAdapter — mock mode', () => {
  describe('Categories', () => {
    it('getCategories returns array', async () => {
      const cats = await DataAdapter.getCategories();
      expect(Array.isArray(cats)).toBe(true);
    });

    it('addCategory appends and returns new category', async () => {
      const before = await DataAdapter.getCategories();
      const newCat = await DataAdapter.addCategory({ code: 'TST', name: 'Test', type: 'expense', color: '#000' });
      expect(newCat).toHaveProperty('id');
      expect(newCat.name).toBe('Test');
      const after = await DataAdapter.getCategories();
      expect(after.length).toBe(before.length + 1);
    });

    it('updateCategory modifies existing', async () => {
      const cats = await DataAdapter.getCategories();
      const first = cats[0];
      await DataAdapter.updateCategory(first.id, { name: 'Updated' });
      const updated = (await DataAdapter.getCategories()).find(c => c.id === first.id);
      expect(updated.name).toBe('Updated');
    });

    it('deleteCategory removes by id', async () => {
      const added = await DataAdapter.addCategory({ code: 'DEL', name: 'Delete Me', type: 'income', color: '#fff' });
      const before = await DataAdapter.getCategories();
      await DataAdapter.deleteCategory(added.id);
      const after = await DataAdapter.getCategories();
      expect(after.length).toBe(before.length - 1);
      expect(after.find(c => c.id === added.id)).toBeUndefined();
    });

    it('getCategories filters by type', async () => {
      const income = await DataAdapter.getCategories('income');
      expect(income.every(c => c.type === 'income')).toBe(true);
      const expense = await DataAdapter.getCategories('expense');
      expect(expense.every(c => c.type === 'expense')).toBe(true);
    });
  });

  describe('Transactions', () => {
    it('getTransactions returns array', async () => {
      const txs = await DataAdapter.getTransactions();
      expect(Array.isArray(txs)).toBe(true);
    });

    it('addTransaction prepends', async () => {
      const before = await DataAdapter.getTransactions();
      const tx = await DataAdapter.addTransaction({
        date: '2026-01-15', type: 'income', amount: 500000,
        categoryId: null, memberId: null, recipientName: 'Test', note: '',
      });
      expect(tx).toHaveProperty('id');
      const after = await DataAdapter.getTransactions();
      expect(after.length).toBe(before.length + 1);
    });

    it('deleteTransaction removes by id', async () => {
      const added = await DataAdapter.addTransaction({
        date: '2026-01-15', type: 'expense', amount: 100000,
        categoryId: null, recipientName: 'Del', note: '',
      });
      await DataAdapter.deleteTransaction(added.id);
      const after = await DataAdapter.getTransactions();
      expect(after.find(t => t.id === added.id)).toBeUndefined();
    });
  });

  describe('Savings Goals', () => {
    it('addSavingsGoal creates goal', async () => {
      const goal = await DataAdapter.addSavingsGoal({
        name: 'Laptop', target: 20000000, saved: 0,
        emoji: '💻', color: '#7C3AED', deadline: null,
      });
      expect(goal).toHaveProperty('id');
      expect(goal.name).toBe('Laptop');
      expect(goal.saved).toBe(0);
    });

    it('addSavingsContrib increments saved', async () => {
      const goal = await DataAdapter.addSavingsGoal({
        name: 'Phone', target: 10000000, saved: 0,
        emoji: '📱', color: '#059669', deadline: null,
      });
      await DataAdapter.addSavingsContrib(goal.id, 2000000);
      const personal = await DataAdapter.getPersonalData();
      const updated = personal.savingsGoals.find(g => g.id === goal.id);
      expect(updated.saved).toBe(2000000);
    });

    it('updateSavingsGoal modifies fields', async () => {
      const goal = await DataAdapter.addSavingsGoal({
        name: 'Old Name', target: 5000000, saved: 0,
        emoji: '🎯', color: '#DC2626', deadline: null,
      });
      await DataAdapter.updateSavingsGoal(goal.id, { name: 'New Name' });
      const personal = await DataAdapter.getPersonalData();
      const updated = personal.savingsGoals.find(g => g.id === goal.id);
      expect(updated.name).toBe('New Name');
    });
  });

  describe('Auth mock mode', () => {
    it('signIn rejects wrong credentials', async () => {
      await expect(DataAdapter.signIn('wrong@email.com', 'badpass')).rejects.toThrow();
    });

    it('signIn accepts default profile credentials', async () => {
      const profile = DataAdapter.getLocalProfile();
      const result = await DataAdapter.signIn(profile.email, profile.password);
      expect(result).toHaveProperty('user');
    });

    it('getSession returns session after signIn', async () => {
      const profile = DataAdapter.getLocalProfile();
      await DataAdapter.signIn(profile.email, profile.password);
      const session = await DataAdapter.getSession();
      expect(session).toBeTruthy();
    });

    it('getSession returns null after signOut', async () => {
      await DataAdapter.signOut();
      const session = await DataAdapter.getSession();
      expect(session).toBeNull();
    });
  });
});
