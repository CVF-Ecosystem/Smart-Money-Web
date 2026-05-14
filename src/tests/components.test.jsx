import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ConfirmDialog } from '../sm-confirm.jsx';

describe('ConfirmDialog', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('should render the dialog with title and message', async () => {
    // Show the dialog
    const promise = ConfirmDialog.show('Xóa dữ liệu', 'Bạn có chắc muốn xóa?');
    
    // Wait for the dialog to appear in the DOM
    await waitFor(() => {
      expect(screen.getByText('Xóa dữ liệu')).toBeDefined();
    });
    expect(screen.getByText('Bạn có chắc muốn xóa?')).toBeDefined();
    
    // Find the cancel button and click it to clean up
    const cancelBtn = screen.getByText('Hủy');
    fireEvent.click(cancelBtn);
    
    const result = await promise;
    expect(result).toBe(false);
  });

  it('should return true when confirm button is clicked', async () => {
    const promise = ConfirmDialog.show('Confirm', 'Are you sure?');
    
    await waitFor(() => {
      expect(screen.getByText('Confirm')).toBeDefined();
    });
    
    const confirmBtn = screen.getByText('Xác nhận xóa');
    fireEvent.click(confirmBtn);
    
    const result = await promise;
    expect(result).toBe(true);
  });
});
