import type { ChartModuleProps } from '../types';
import { formatColLabel } from '../utils/dataProcessors';
import { T } from '../../dashboard/tokens';

export function KPIModule({
  data,
  yColumns,
  column_metadata,
  yLabel,
}: ChartModuleProps) {
  if (!data || data.length === 0 || !yColumns || yColumns.length === 0) {
    return <div style={{ color: T.text3, padding: 20 }}>No KPI data available</div>;
  }

  const primaryCol = yColumns[0];
  const rawValue = data[0][primaryCol];
  const label = yLabel || formatColLabel(primaryCol);
  const isCurrency = column_metadata?.[primaryCol] === 'currency';

  const formatValue = (v: unknown) => {
    const num = Number(v);
    if (isNaN(num)) return String(v);

    if (isCurrency) {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: num % 1 === 0 ? 0 : 2,
        maximumFractionDigits: 2,
      }).format(num);
    }

    return new Intl.NumberFormat('en-US', {
      maximumFractionDigits: 2,
    }).format(num);
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 20px',
      minHeight: 300,
      background: 'radial-gradient(circle at center, rgba(124, 58, 237, 0.08) 0%, transparent 70%)',
    }}>
      <div style={{
        fontSize: '0.85rem',
        color: T.text3,
        textTransform: 'uppercase',
        letterSpacing: '0.1em',
        marginBottom: 16,
        fontFamily: T.fontMono,
        textAlign: 'center',
      }}>
        {label}
      </div>

      <div style={{
        fontSize: '4.5rem',
        fontWeight: 800,
        color: '#f8fafc',
        lineHeight: 1.1,
        letterSpacing: '-0.02em',
        textAlign: 'center',
        textShadow: '0 0 40px rgba(124, 58, 237, 0.3)',
      }}>
        {formatValue(rawValue)}
      </div>

      <div style={{
        marginTop: 32,
        padding: '6px 16px',
        background: 'rgba(255, 255, 255, 0.03)',
        border: `1px solid ${T.border}`,
        borderRadius: 100,
        fontSize: '0.7rem',
        color: T.text3,
        fontFamily: T.fontMono,
      }}>
        Single Data Point Result
      </div>
    </div>
  );
}
