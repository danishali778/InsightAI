import React from 'react';
import { T } from '../dashboard/tokens';

type CardVariant = 'default' | 'elevated' | 'interactive';

interface CardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  variant?: CardVariant;
  heading?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
}

const getVariantStyles = (variant: CardVariant) => {
  const baseStyle: React.CSSProperties = {
    background: T.s2,
    border: `1px solid ${T.border}`,
    borderRadius: T.radius.md,
    padding: T.card.padding,
    transition: `all ${T.transition}`,
  };

  switch (variant) {
    case 'elevated':
      return {
        ...baseStyle,
        background: T.s3,
        boxShadow: T.shadow.md,
      };

    case 'interactive':
      return {
        ...baseStyle,
        cursor: 'pointer',
        '&:hover': {
          background: T.s3,
          borderColor: T.border2,
          boxShadow: T.shadow.sm,
        },
      };

    case 'default':
    default:
      return baseStyle;
  }
};

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ variant = 'default', heading, action, children, style, ...props }, ref) => {
    const variantStyles = getVariantStyles(variant);

    const cardStyle: React.CSSProperties = {
      ...variantStyles,
      ...(style as any),
    };

    return (
      <div ref={ref} style={cardStyle} {...props}>
        {heading && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: T.card.gap,
              paddingBottom: T.space[3],
              borderBottom: `1px solid ${T.border}`,
            }}
          >
            <div
              style={{
                fontSize: '1rem',
                fontWeight: 600,
                color: T.text,
                fontFamily: T.fontBody,
              }}
            >
              {heading}
            </div>
            {action && <div>{action}</div>}
          </div>
        )}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: T.card.gap,
          }}
        >
          {children}
        </div>
      </div>
    );
  }
);

Card.displayName = 'Card';
