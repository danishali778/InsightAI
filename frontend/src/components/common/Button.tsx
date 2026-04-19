import React from 'react';
import { T } from '../dashboard/tokens';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';
type ButtonType = 'button' | 'submit' | 'reset';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  children: React.ReactNode;
  type?: ButtonType;
}

const getVariantStyles = (variant: ButtonVariant, disabled: boolean) => {
  const baseStyle = {
    background: 'transparent',
    border: `1px solid ${T.border2}`,
    color: T.text,
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
    transition: `all ${T.transition}`,
    fontFamily: T.fontBody,
    fontWeight: T.button.fontWeight,
  };

  switch (variant) {
    case 'primary':
      return {
        ...baseStyle,
        background: T.accent,
        border: `1px solid ${T.accent}`,
        color: T.bg,
        '&:hover': {
          background: disabled ? T.accent : 'rgba(0, 229, 255, 0.8)',
          boxShadow: `0 0 20px rgba(0, 229, 255, 0.3)`,
        },
      };

    case 'secondary':
      return {
        ...baseStyle,
        background: T.s2,
        border: `1px solid ${T.border2}`,
        color: T.text,
        '&:hover': {
          background: disabled ? T.s2 : T.s3,
          borderColor: T.accent,
        },
      };

    case 'danger':
      return {
        ...baseStyle,
        background: 'transparent',
        border: `1px solid ${T.red}`,
        color: T.red,
        '&:hover': {
          background: disabled ? 'transparent' : 'rgba(248, 113, 113, 0.1)',
          borderColor: T.red,
        },
      };

    case 'ghost':
    default:
      return {
        ...baseStyle,
        background: 'transparent',
        border: 'none',
        color: T.text2,
        '&:hover': {
          color: disabled ? T.text2 : T.accent,
        },
      };
  }
};

const getSizeStyles = (size: ButtonSize) => {
  switch (size) {
    case 'sm':
      return {
        height: T.size.sm,
        padding: T.button.padding.sm,
        fontSize: T.button.fontSize.sm,
        borderRadius: T.radius.md,
      };
    case 'lg':
      return {
        height: T.size.lg,
        padding: T.button.padding.lg,
        fontSize: T.button.fontSize.lg,
        borderRadius: T.radius.md,
      };
    case 'md':
    default:
      return {
        height: T.size.md,
        padding: T.button.padding.md,
        fontSize: T.button.fontSize.md,
        borderRadius: T.radius.md,
      };
  }
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'secondary',
      size = 'md',
      isLoading = false,
      disabled = false,
      children,
      style,
      ...props
    },
    ref
  ) => {
    const variantStyles = getVariantStyles(variant, disabled || isLoading);
    const sizeStyles = getSizeStyles(size);

    const buttonStyle: React.CSSProperties = {
      ...variantStyles,
      ...sizeStyles,
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: T.space[2],
      whiteSpace: 'nowrap',
      ...(style as React.CSSProperties),
    };

    return (
      <button
        ref={ref}
        style={buttonStyle}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <span style={{ display: 'inline-block', animation: `spin 1s linear infinite` }}>
            ⚙️
          </span>
        ) : (
          children
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';
