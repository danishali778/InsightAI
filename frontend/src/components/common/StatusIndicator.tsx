import React from 'react';
import { T } from '../dashboard/tokens';

type StatusType = 'online' | 'offline' | 'loading' | 'error';

interface StatusIndicatorProps {
  status: StatusType;
  latency?: number;
  label?: string;
  size?: 'sm' | 'md';
}

const getStatusColor = (status: StatusType): string => {
  switch (status) {
    case 'online':
      return T.green;
    case 'loading':
      return T.yellow;
    case 'error':
    case 'offline':
      return T.red;
    default:
      return T.text2;
  }
};

const getStatusLabel = (status: StatusType): string => {
  switch (status) {
    case 'online':
      return 'Live';
    case 'offline':
      return 'Offline';
    case 'loading':
      return 'Connecting';
    case 'error':
      return 'Error';
    default:
      return 'Unknown';
  }
};

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  status,
  latency,
  label,
  size = 'md',
}) => {
  const color = getStatusColor(status);
  const dotSize = size === 'sm' ? 6 : T.statusIndicator.size;
  const fontSize = size === 'sm' ? '0.75rem' : '0.875rem';
  const displayLabel = label || getStatusLabel(status);

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: T.space[2],
        fontSize: fontSize,
        color: color,
        fontFamily: T.fontBody,
      }}
    >
      {/* Status dot */}
      <div
        style={{
          display: 'inline-block',
          width: dotSize,
          height: dotSize,
          borderRadius: '50%',
          background: color,
          animation:
            status === 'loading'
              ? `pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite`
              : status === 'online'
                ? `pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite`
                : 'none',
          boxShadow: `0 0 ${dotSize * 2}px ${color}40`,
        }}
      />

      {/* Status text */}
      <span style={{ fontWeight: 500 }}>{displayLabel}</span>

      {/* Latency badge (if provided and online) */}
      {latency !== undefined && (latency > 0 || latency === 0) && status === 'online' && (
        <span
          style={{
            marginLeft: T.space[1],
            color: T.text2,
            fontSize: '0.75rem',
            opacity: 0.8,
          }}
        >
          · {latency}ms
        </span>
      )}
    </div>
  );
};

StatusIndicator.displayName = 'StatusIndicator';
