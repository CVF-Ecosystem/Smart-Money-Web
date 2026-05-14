const { useState, useEffect, useCallback, createContext, useContext } = React;

const ToastCtx = createContext(null);

let toastId = 0;
let addToastFn = null;

const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  addToastFn = useCallback((msg, type = 'info') => {
    const id = ++toastId;
    setToasts(prev => [...prev, { id, msg, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  }, []);

  return (
    <ToastCtx.Provider value={addToastFn}>
      {children}
      <div style={{ position: 'fixed', bottom: 20, right: 20, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {toasts.map(t => (
          <div key={t.id} className="fade-in" style={{
            background: t.type === 'error' ? 'var(--expense)' : t.type === 'success' ? 'var(--income)' : '#334155',
            color: '#fff', padding: '12px 20px', borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, fontWeight: 500
          }}>
            {t.type === 'error' ? IC.alert(16) : t.type === 'success' ? IC.checkCircle(16) : IC.info(16)}
            {t.msg}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
};

window.Toast = {
  show: (msg, type) => {
    if (addToastFn) addToastFn(msg, type);
    else console.warn('ToastProvider not mounted', msg);
  },
  success: msg => window.Toast.show(msg, 'success'),
  error: msg => window.Toast.show(msg, 'error'),
  info: msg => window.Toast.show(msg, 'info')
};

window.ToastProvider = ToastProvider;
