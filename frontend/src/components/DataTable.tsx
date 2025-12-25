/**
 * DataTable Component
 * Renders query results as a styled table
 */

interface DataTableProps {
    data: Record<string, unknown>[];
}

export function DataTable({ data }: DataTableProps) {
    if (!data || data.length === 0) {
        return (
            <p className="text-gray-400 text-center py-4">No data available</p>
        );
    }

    // Get column headers from the first row
    const columns = Object.keys(data[0]);

    // Format cell value for display
    const formatValue = (value: unknown): string => {
        if (value === null || value === undefined) {
            return '-';
        }
        if (typeof value === 'number') {
            // Format numbers with commas
            return value.toLocaleString('en-US', {
                maximumFractionDigits: 2,
            });
        }
        return String(value);
    };

    return (
        <table className="w-full border-collapse">
            <thead>
                <tr className="border-b border-white/10">
                    {columns.map((col) => (
                        <th
                            key={col}
                            className="text-left py-3 px-4 text-sm font-semibold text-purple-300 uppercase tracking-wider"
                        >
                            {col.replace(/_/g, ' ')}
                        </th>
                    ))}
                </tr>
            </thead>
            <tbody>
                {data.map((row, rowIndex) => (
                    <tr
                        key={rowIndex}
                        className="border-b border-white/5 hover:bg-white/5 transition-colors"
                    >
                        {columns.map((col) => (
                            <td
                                key={col}
                                className="py-3 px-4 text-sm text-gray-300"
                            >
                                {formatValue(row[col])}
                            </td>
                        ))}
                    </tr>
                ))}
            </tbody>
        </table>
    );
}

export default DataTable;
