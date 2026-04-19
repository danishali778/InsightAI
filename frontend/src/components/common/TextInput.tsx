import React from 'react';
import { T } from '../dashboard/tokens';

interface TextInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

const getSizeStyles = (size: 'sm' | 'md' | 'lg' = 'md') => {
  switch (size) {
    case 'sm':
      return {
        height: T.size.sm,
        padding: '6px 10px',
        fontSize: '0.875rem',
      };
    case 'lg':
      return {
        height: T.size.lg,
        padding: '12px 16px',
        fontSize: '1rem',
      };
    case 'md':
    default:
      return {
        height: T.size.md,
        padding: T.input.padding,
        fontSize: T.input.fontSize,
      };
  }
};

export const TextInput = React.forwardRef<HTMLInputElement, TextInputProps>(
  ({ label, error, icon, size = 'md', style, ...props }, ref) => {
    const sizeStyles = getSizeStyles(size);

    const inputStyle: React.CSSProperties = {
      ...sizeStyles,
      display: 'block',
      width: '100%',
      background: T.s1,
      border: `1px solid ${error ? T.red : T.border2}`,
      borderRadius: T.radius.md,
      color: T.text,
      fontFamily: T.fontBody,
      transition: `all ${T.transition}`,
      boxSizing: 'border-box',
      ...(style as React.CSSProperties),
    };

    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: T.space[2],
          width: '100%',
        }}
      >
        {label && (
          <label
            style={{
              fontSize: '0.875rem',
              fontWeight: 500,
              color: T.text2,
              fontFamily: T.fontBody,
            }}
          >
            {label}
          </label>
        )}

        <div
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          {icon && (
            <div
              style={{
                position: 'absolute',
                left: T.space[3],
                display: 'flex',
                alignItems: 'center',
                color: T.text2,
                pointerEvents: 'none',
              }}
            >
              {icon}
            </div>
          )}

          <input
            ref={ref}
            style={{
              ...inputStyle,
              paddingLeft: icon ? `${T.space[4] + 16}px` : sizeStyles.padding,
              outline: 'none',
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = T.accent;
              e.currentTarget.style.boxShadow = `0 0 12px rgba(0, 229, 255, 0.15)`;
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = error ? T.red : T.border2;
              e.currentTarget.style.boxShadow = 'none';
            }}
            {...props}
          />
        </div>

        {error && (
          <span
            style={{
              fontSize: '0.75rem',
              color: T.red,
              fontFamily: T.fontBody,
            }}
          >
            {error}
          </span>
        )}
      </div>
    );
  }
);

TextInput.displayName = 'TextInput';
