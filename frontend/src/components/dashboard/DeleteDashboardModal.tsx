import { T } from '../dashboard/tokens';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  dashboardName: string;
}

export function DeleteDashboardModal({ isOpen, onClose, onConfirm, dashboardName }: Props) {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20, background: 'rgba(2,4,8,0.7)', backdropFilter: 'blur(8px)'
    }}>
      <div 
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 400,
          background: 'rgba(11,17,32,0.95)',
          border: `1px solid ${T.border}`,
          borderRadius: 16, padding: '24px 28px',
          boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
          animation: 'modalScale 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        <div style={{ fontSize: '1.5rem', marginBottom: 16 }}>🗑️</div>
        <div style={{ 
          fontFamily: T.fontHead, fontSize: '1.1rem', fontWeight: 800, 
          color: T.text, marginBottom: 10 
        }}>
          Delete Dashboard?
        </div>
        <div style={{ 
          fontSize: '0.85rem', color: T.text3, lineHeight: 1.6, marginBottom: 24 
        }}>
          Are you sure you want to delete <strong style={{ color: T.text2 }}>"{dashboardName}"</strong>? 
          This will permanently remove all associated widgets and visualizations. This action cannot be undone.
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button 
            onClick={onClose}
            style={{
              flex: 1, padding: '10px 0', borderRadius: 10,
              background: 'transparent', border: `1px solid ${T.border2}`,
              color: T.text2, fontSize: '0.82rem', fontWeight: 600,
              cursor: 'pointer', transition: 'all 0.2s',
              fontFamily: T.fontBody
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)';
              e.currentTarget.style.color = T.text;
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = T.border2;
              e.currentTarget.style.color = T.text2;
            }}
          >
            Cancel
          </button>
          <button 
            onClick={onConfirm}
            style={{
              flex: 1, padding: '10px 0', borderRadius: 10,
              background: 'rgba(248,113,113,0.12)', border: '1px solid rgba(248,113,113,0.3)',
              color: '#f87171', fontSize: '0.82rem', fontWeight: 600,
              cursor: 'pointer', transition: 'all 0.2s',
              fontFamily: T.fontBody
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(248,113,113,0.2)';
              e.currentTarget.style.borderColor = 'rgba(248,113,113,0.45)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(248,113,113,0.12)';
              e.currentTarget.style.borderColor = 'rgba(248,113,113,0.3)';
            }}
          >
            Delete Dashboard
          </button>
        </div>
      </div>

      <style>{`
        @keyframes modalScale {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
