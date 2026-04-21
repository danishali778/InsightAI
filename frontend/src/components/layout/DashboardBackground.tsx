import React from 'react';

/**
 * A premium, animated mesh gradient background.
 * Provides a high-end SaaS feel without interfering with content.
 */
export const DashboardBackground: React.FC = () => {
  return (
    <div 
      className="dashboard-bg-mesh"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: -1,
        overflow: 'hidden',
        background: '#fcfcfd', // Light mode base
        pointerEvents: 'none',
      }}
    >
      {/* Mesh Blob 1 */}
      <div style={{
        position: 'absolute',
        top: '-10%',
        right: '-5%',
        width: '60vw',
        height: '60vw',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(0, 229, 255, 0.08) 0%, rgba(0, 229, 255, 0) 70%)',
        filter: 'blur(80px)',
        animation: 'mesh-float 20s infinite alternate ease-in-out',
      }} />

      {/* Mesh Blob 2 */}
      <div style={{
        position: 'absolute',
        bottom: '-15%',
        left: '-10%',
        width: '70vw',
        height: '70vw',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(124, 58, 255, 0.06) 0%, rgba(124, 58, 255, 0) 70%)',
        filter: 'blur(100px)',
        animation: 'mesh-float 25s infinite alternate-reverse ease-in-out',
      }} />

      {/* Mesh Blob 3 */}
      <div style={{
        position: 'absolute',
        top: '20%',
        left: '20%',
        width: '40vw',
        height: '40vw',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(255, 125, 220, 0.04) 0%, rgba(255, 125, 220, 0) 70%)',
        filter: 'blur(120px)',
        animation: 'mesh-float 30s infinite alternate ease-in-out',
      }} />

      <style>{`
        @keyframes mesh-float {
          0% { transform: translate(0, 0) rotate(0deg) scale(1); }
          50% { transform: translate(5%, 5%) rotate(10deg) scale(1.1); }
          100% { transform: translate(-5%, 2%) rotate(-5deg) scale(0.9); }
        }
        
        /* Dark mode support if needed */
        [data-theme='dark'] .dashboard-bg-mesh {
          background: #0b0f1a;
        }
      `}</style>
    </div>
  );
};
