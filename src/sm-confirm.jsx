import React from 'react';
import { createRoot } from 'react-dom/client';
import { IC } from './sm-icons.jsx';

export const ConfirmDialog = {
  show(title, message) {
    return new Promise((resolve) => {
      const div = document.createElement('div');
      document.body.appendChild(div);
      const root = createRoot(div);

      function cleanup() {
        setTimeout(() => {
          root.unmount();
          if (div.parentNode) {
            div.parentNode.removeChild(div);
          }
        }, 300); // Wait for exit animation
      }

      function onConfirm() {
        resolve(true);
        cleanup();
      }

      function onCancel() {
        resolve(false);
        cleanup();
      }

      root.render(
        <div className="modal-overlay" style={{ display: 'flex', zIndex: 9999 }}>
          <div className="modal-content fade-in" style={{ maxWidth: 400, width: '100%', padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--expense-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--expense)', flexShrink: 0 }}>
                {IC.alert ? IC.alert(20) : null}
              </div>
              <h3 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 18, fontWeight: 700 }}>{title}</h3>
            </div>
            
            <p style={{ color: 'var(--text-2)', fontSize: 14, marginBottom: 24, lineHeight: 1.5 }}>
              {message}
            </p>
            
            <div className="modal-actions" style={{ marginTop: 0 }}>
              <button className="btn btn-ghost" onClick={onCancel}>Hủy</button>
              <button className="btn btn-primary" style={{ background: 'var(--expense)', borderColor: 'var(--expense)' }} onClick={onConfirm}>Xác nhận xóa</button>
            </div>
          </div>
        </div>
      );
    });
  }
};
