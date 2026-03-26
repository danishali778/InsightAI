import React from 'react';
import { T } from '../dashboard/tokens';

type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info';
type BadgeSize = 'sm' | 'md';

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

const getVariantStyles = (
  variant: BadgeVariant
): {
  background: string;
  color: string;
  borderColor: string;
} => {
  switch (variant) {
    case 'success':
      return {
        background: `rgba(34, 211, 165, 0.15)`,
        color: T.green,
        borderColor: `rgba(34, 211, 165, 0.3)`,
      };
    case 'warning':
      return {
        background: `rgba(245, 158, 11, 0.15)`,
        color: T.yellow,
        borderColor: `rgba(245, 158, 11, 0.3)`,
      };
    case 'error':
      return {
        background: `rgba(248, 113, 113, 0.15)`,
        color: T.red,
        borderColor: `rgba(248, 113, 113, 0.3)`,
      };
    case 'info':
      return {
        background: `rgba(0, 229, 255, 0.15)`,
        color: T.accent,
        borderColor: `rgba(0, 229, 255, 0.3)`,
      };
    case 'default':
    default:
      return {
        background: `rgba(255, 255, 255, 0.08)`,
        color: T.text2,
        borderColor: T.border,
      };
  }
};

const getSizeStyles = (
  size: BadgeSize
): { fontSize: string; padding: string; height: string } => {
  switch (size) {
    case 'sm':
      return {
        fontSize: '0.7rem',
        padding: '2px 6px',
        height: '20px',
      };
    case 'md':
    default:
      return {
        fontSize: T.badge.fontSize,
        padding: T.badge.padding,
        height: `${T.badge.height}px`,
      };
  }
};

export const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ variant = 'default', size = 'md', icon, children, style, ...props }, ref) => {
    const variantStyles = getVariantStyles(variant);
    const sizeStyles = getSizeStyles(size);

    const badgeStyle: React.CSSProperties = {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: T.space[1],
      background: variantStyles.background,
      color: variantStyles.color,
      border: `1px solid ${variantStyles.borderColor}`,
      borderRadius: T.badge.borderRadius,
      ...sizeStyles,
      fontFamily: T.fontBody,
      fontWeight: 500,
      whiteSpace: 'nowrap',
      transition: `all ${T.transitionShort}`,
      ...(style as any),
    };

    return (
      <div ref={ref} style={badgeStyle} {...props}>
        {icon && <span>{icon}</span>}
        <span>{children}</span>
      </div>
    );
  }
);

Badge.displayName = 'Badge';
