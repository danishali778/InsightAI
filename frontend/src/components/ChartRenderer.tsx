/**
 * ChartRenderer Component
 * Dynamically renders charts based on visualization config
 */

import {
    BarChart,
    Bar,
    LineChart,
    Line,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    AreaChart,
    Area,
    ScatterChart,
    Scatter,
    RadarChart,
    Radar,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    ComposedChart,
    FunnelChart,
    Funnel,
    LabelList,
    ReferenceLine,
} from 'recharts';
import type { VisualizationConfig } from '../services/api';

interface ChartRendererProps {
    config: VisualizationConfig;
}

const COLORS = [
    '#667eea',
    '#764ba2',
    '#10b981',
    '#f59e0b',
    '#ef4444',
    '#3b82f6',
    '#8b5cf6',
    '#ec4899',
];

export function ChartRenderer({ config }: ChartRendererProps) {
    if (!config || !config.data) {
        return null;
    }

    // Handle error type
    if (config.type === 'error') {
        return (
            <div className="glass-card p-8 text-center">
                <div className="text-6xl mb-4">❌</div>
                <h3 className="text-xl font-semibold text-red-400 mb-2">{config.title}</h3>
                <p className="text-gray-400">{config.message}</p>
            </div>
        );
    }

    // Parse data if it's a string
    let chartData: Record<string, unknown>[] = [];
    if (typeof config.data === 'string') {
        try {
            chartData = JSON.parse(config.data);
        } catch {
            // If parsing fails, show as table
            return (
                <div className="glass-card p-6">
                    <h3 className="text-xl font-semibold mb-4 gradient-text">{config.title}</h3>
                    <pre className="text-sm text-gray-300 overflow-auto">{String(config.data)}</pre>
                </div>
            );
        }
    } else if (Array.isArray(config.data)) {
        chartData = config.data as Record<string, unknown>[];
    }

    // Helper to get yKey as string (for single-metric charts)
    const getYKey = (): string => {
        if (Array.isArray(config.yKey)) {
            return config.yKey[0] || 'value';
        }
        return config.yKey || 'value';
    };

    // Ensure chartData is an array
    if (!Array.isArray(chartData)) {
        chartData = [chartData as Record<string, unknown>];
    }

    const renderChart = () => {
        switch (config.type) {
            case 'bar':
                return (
                    <BarChart
                        width={800}
                        height={400}
                        data={chartData}
                        margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                        <XAxis
                            dataKey={config.xKey}
                            stroke="rgba(255,255,255,0.7)"
                            tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 12 }}
                            interval={0}
                            angle={-45}
                            textAnchor="end"
                            height={80}
                        />
                        <YAxis
                            stroke="rgba(255,255,255,0.7)"
                            tick={{ fill: 'rgba(255,255,255,0.7)' }}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: '#1a1a2e',
                                border: '1px solid rgba(102, 126, 234, 0.3)',
                                borderRadius: '8px',
                            }}
                        />
                        <Legend />
                        <Bar
                            dataKey={getYKey()}
                            fill="url(#barGradient)"
                            radius={[4, 4, 0, 0]}
                            isAnimationActive={false}
                        />
                        <defs>
                            <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#667eea" />
                                <stop offset="100%" stopColor="#764ba2" />
                            </linearGradient>
                        </defs>
                    </BarChart>
                );

            case 'line':
                return (
                    <LineChart
                        width={800}
                        height={400}
                        data={chartData}
                        margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                        <XAxis
                            dataKey={config.xKey}
                            stroke="rgba(255,255,255,0.7)"
                            tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 12 }}
                            interval={0}
                            angle={-45}
                            textAnchor="end"
                            height={80}
                        />
                        <YAxis
                            stroke="rgba(255,255,255,0.7)"
                            tick={{ fill: 'rgba(255,255,255,0.7)' }}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: '#1a1a2e',
                                border: '1px solid rgba(102, 126, 234, 0.3)',
                                borderRadius: '8px',
                            }}
                        />
                        <Legend />
                        <Line
                            type="monotone"
                            dataKey={getYKey()}
                            stroke="#667eea"
                            strokeWidth={3}
                            dot={{ fill: '#764ba2', strokeWidth: 2 }}
                            activeDot={{ r: 8, fill: '#667eea' }}
                        />
                    </LineChart>
                );

            case 'pie':
                return (
                    <PieChart width={800} height={400}>
                        <Pie
                            data={chartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={80}
                            outerRadius={150}
                            paddingAngle={2}
                            dataKey={getYKey()}
                            nameKey={config.xKey || 'name'}
                            label={({ name, percent }) => `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`}
                            labelLine={{ stroke: 'rgba(255,255,255,0.3)' }}
                        >
                            {chartData.map((_, index) => (
                                <Cell
                                    key={`cell-${index}`}
                                    fill={COLORS[index % COLORS.length]}
                                />
                            ))}
                        </Pie>
                        <Tooltip
                            contentStyle={{
                                backgroundColor: '#1a1a2e',
                                border: '1px solid rgba(102, 126, 234, 0.3)',
                                borderRadius: '8px',
                            }}
                        />
                        <Legend />
                    </PieChart>
                );

            case 'area':
                return (
                    <AreaChart
                        width={800}
                        height={400}
                        data={chartData}
                        margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                    >
                        <defs>
                            <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#667eea" stopOpacity={0.8} />
                                <stop offset="95%" stopColor="#764ba2" stopOpacity={0.1} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                        <XAxis
                            dataKey={config.xKey}
                            stroke="rgba(255,255,255,0.7)"
                            tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 12 }}
                            interval={0}
                            angle={-45}
                            textAnchor="end"
                            height={80}
                        />
                        <YAxis
                            stroke="rgba(255,255,255,0.7)"
                            tick={{ fill: 'rgba(255,255,255,0.7)' }}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: '#1a1a2e',
                                border: '1px solid rgba(102, 126, 234, 0.3)',
                                borderRadius: '8px',
                            }}
                        />
                        <Legend />
                        <Area
                            type="monotone"
                            dataKey={getYKey()}
                            stroke="#667eea"
                            fill="url(#areaGradient)"
                            strokeWidth={2}
                        />
                    </AreaChart>
                );

            case 'scatter': {
                // For scatter, we need numeric x and y values
                const xKey = config.xKey || 'x';
                const yKey = getYKey();

                return (
                    <ScatterChart
                        width={800}
                        height={400}
                        margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                        <XAxis
                            type="category"
                            dataKey={xKey}
                            stroke="rgba(255,255,255,0.7)"
                            tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 11 }}
                            name={xKey}
                            allowDuplicatedCategory={false}
                        />
                        <YAxis
                            type="number"
                            stroke="rgba(255,255,255,0.7)"
                            tick={{ fill: 'rgba(255,255,255,0.7)' }}
                            name={yKey}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: '#1a1a2e',
                                border: '1px solid rgba(102, 126, 234, 0.3)',
                                borderRadius: '8px',
                            }}
                            cursor={{ strokeDasharray: '3 3' }}
                        />
                        <Legend />
                        <Scatter
                            name={String(yKey).replace(/_/g, ' ')}
                            data={chartData}
                            fill="#667eea"
                            dataKey={yKey}
                        >
                            {chartData.map((_, index) => (
                                <Cell
                                    key={`cell-${index}`}
                                    fill={COLORS[index % COLORS.length]}
                                />
                            ))}
                        </Scatter>
                    </ScatterChart>
                );
            }

            case 'radar': {
                // Handle both single yKey and array of yKeys for multi-metric radar
                const yKeys = Array.isArray(config.yKey)
                    ? config.yKey
                    : [config.yKey || 'value'];

                return (
                    <RadarChart
                        width={800}
                        height={400}
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        outerRadius="80%"
                    >
                        <PolarGrid stroke="rgba(255,255,255,0.2)" />
                        <PolarAngleAxis
                            dataKey={config.xKey}
                            tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 12 }}
                        />
                        <PolarRadiusAxis
                            tick={{ fill: 'rgba(255,255,255,0.5)' }}
                        />
                        {yKeys.map((key, index) => (
                            <Radar
                                key={key}
                                name={String(key).replace(/_/g, ' ')}
                                dataKey={key}
                                stroke={COLORS[index % COLORS.length]}
                                fill={COLORS[index % COLORS.length]}
                                fillOpacity={0.3}
                            />
                        ))}
                        <Tooltip
                            contentStyle={{
                                backgroundColor: '#1a1a2e',
                                border: '1px solid rgba(102, 126, 234, 0.3)',
                                borderRadius: '8px',
                            }}
                        />
                        <Legend />
                    </RadarChart>
                );
            }

            case 'composed': {
                // Handle both single yKey and array of yKeys
                const yKeys = Array.isArray(config.yKey)
                    ? config.yKey
                    : [config.yKey || 'value'];

                return (
                    <ComposedChart
                        width={800}
                        height={400}
                        data={chartData}
                        margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                        <XAxis
                            dataKey={config.xKey}
                            stroke="rgba(255,255,255,0.7)"
                            tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 12 }}
                            interval={0}
                            angle={-45}
                            textAnchor="end"
                            height={80}
                        />
                        {/* Left Y-Axis for Bars (primary metric) */}
                        <YAxis
                            yAxisId="left"
                            stroke="#667eea"
                            tick={{ fill: '#667eea', fontSize: 11 }}
                            tickFormatter={(value) => {
                                if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
                                if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
                                return value.toFixed(0);
                            }}
                            label={{
                                value: String(yKeys[0]).replace(/_/g, ' '),
                                angle: -90,
                                position: 'insideLeft',
                                fill: '#667eea',
                                fontSize: 12
                            }}
                        />
                        {/* Right Y-Axis for Lines (secondary metrics) */}
                        {yKeys.length > 1 && (
                            <YAxis
                                yAxisId="right"
                                orientation="right"
                                stroke="#10b981"
                                tick={{ fill: '#10b981', fontSize: 11 }}
                                tickFormatter={(value) => {
                                    // Format as percentage if values are between 0-100
                                    if (value <= 100 && value >= 0) return `${value.toFixed(1)}%`;
                                    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
                                    return value.toFixed(1);
                                }}
                                label={{
                                    value: yKeys.slice(1).map(k => String(k).replace(/_/g, ' ')).join(' / '),
                                    angle: 90,
                                    position: 'insideRight',
                                    fill: '#10b981',
                                    fontSize: 12
                                }}
                            />
                        )}
                        <Tooltip
                            contentStyle={{
                                backgroundColor: '#1a1a2e',
                                border: '1px solid rgba(102, 126, 234, 0.3)',
                                borderRadius: '8px',
                            }}
                            formatter={(value, name) => {
                                const numValue = Number(value) || 0;
                                const strName = String(name);
                                // Format tooltip values nicely
                                const isPercentage = strName.toLowerCase().includes('percent') ||
                                    strName.toLowerCase().includes('rate') ||
                                    (numValue <= 100 && numValue >= 0 && yKeys.slice(1).some(k => String(k) === strName.replace(/ /g, '_')));
                                if (isPercentage) return [`${numValue.toFixed(2)}%`, strName];
                                if (numValue >= 1000000) return [`${(numValue / 1000000).toFixed(2)}M`, strName];
                                if (numValue >= 1000) return [`${(numValue / 1000).toFixed(2)}K`, strName];
                                return [numValue.toFixed(2), strName];
                            }}
                        />
                        <Legend
                            wrapperStyle={{ paddingTop: '20px' }}
                            formatter={(value) => <span style={{ color: '#e5e7eb' }}>{value}</span>}
                        />
                        <defs>
                            <linearGradient id="composedBarGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#667eea" />
                                <stop offset="100%" stopColor="#764ba2" />
                            </linearGradient>
                        </defs>
                        {/* First metric as bar (left Y-axis) */}
                        <Bar
                            yAxisId="left"
                            dataKey={yKeys[0]}
                            name={String(yKeys[0]).replace(/_/g, ' ')}
                            fill="url(#composedBarGradient)"
                            radius={[4, 4, 0, 0]}
                        />
                        {/* Remaining metrics as lines (right Y-axis) */}
                        {yKeys.length > 1 && (
                            yKeys.slice(1).map((key, index) => (
                                <Line
                                    key={key}
                                    yAxisId="right"
                                    type="monotone"
                                    dataKey={key}
                                    name={String(key).replace(/_/g, ' ')}
                                    stroke={COLORS[(index + 2) % COLORS.length]}
                                    strokeWidth={3}
                                    dot={{ fill: COLORS[(index + 2) % COLORS.length], strokeWidth: 2, r: 4 }}
                                    activeDot={{ r: 6, strokeWidth: 2 }}
                                />
                            ))
                        )}
                        {/* Show hint if only 1 metric */}
                        {yKeys.length === 1 && (
                            <text x="50%" y="20" textAnchor="middle" fill="#f59e0b" fontSize={12}>
                                ⚠️ Combo chart works best with 2+ metrics. Try a query with multiple numeric columns.
                            </text>
                        )}
                    </ComposedChart>
                );
            }

            // ============== STACKED COLUMN CHART (Vertical) ==============
            case 'stacked_column': {
                const yKeys = Array.isArray(config.yKey) ? config.yKey : [config.yKey || 'value'];
                return (
                    <BarChart
                        width={800}
                        height={400}
                        data={chartData}
                        margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                        <XAxis
                            dataKey={config.xKey}
                            stroke="rgba(255,255,255,0.7)"
                            tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 12 }}
                            interval={0}
                            angle={-45}
                            textAnchor="end"
                            height={80}
                        />
                        <YAxis stroke="rgba(255,255,255,0.7)" tick={{ fill: 'rgba(255,255,255,0.7)' }} />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: '#1a1a2e',
                                border: '1px solid rgba(102, 126, 234, 0.3)',
                                borderRadius: '8px',
                            }}
                        />
                        <Legend />
                        {yKeys.map((key, index) => (
                            <Bar
                                key={key}
                                dataKey={key}
                                name={String(key).replace(/_/g, ' ')}
                                stackId="stack1"
                                fill={COLORS[index % COLORS.length]}
                            />
                        ))}
                    </BarChart>
                );
            }

            // ============== STACKED BAR CHART (Horizontal) ==============
            case 'stacked_bar': {
                const yKeys = Array.isArray(config.yKey) ? config.yKey : [config.yKey || 'value'];
                return (
                    <BarChart
                        width={800}
                        height={400}
                        data={chartData}
                        layout="vertical"
                        margin={{ top: 20, right: 30, left: 100, bottom: 20 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                        <XAxis type="number" stroke="rgba(255,255,255,0.7)" tick={{ fill: 'rgba(255,255,255,0.7)' }} />
                        <YAxis
                            type="category"
                            dataKey={config.xKey}
                            stroke="rgba(255,255,255,0.7)"
                            tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 11 }}
                            width={90}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: '#1a1a2e',
                                border: '1px solid rgba(102, 126, 234, 0.3)',
                                borderRadius: '8px',
                            }}
                        />
                        <Legend />
                        {yKeys.map((key, index) => (
                            <Bar
                                key={key}
                                dataKey={key}
                                name={String(key).replace(/_/g, ' ')}
                                stackId="stack1"
                                fill={COLORS[index % COLORS.length]}
                            />
                        ))}
                    </BarChart>
                );
            }

            // ============== CLUSTERED COLUMN CHART (Vertical, side by side) ==============
            case 'clustered_column': {
                const yKeys = Array.isArray(config.yKey) ? config.yKey : [config.yKey || 'value'];
                return (
                    <BarChart
                        width={800}
                        height={400}
                        data={chartData}
                        margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                        <XAxis
                            dataKey={config.xKey}
                            stroke="rgba(255,255,255,0.7)"
                            tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 12 }}
                            interval={0}
                            angle={-45}
                            textAnchor="end"
                            height={80}
                        />
                        <YAxis stroke="rgba(255,255,255,0.7)" tick={{ fill: 'rgba(255,255,255,0.7)' }} />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: '#1a1a2e',
                                border: '1px solid rgba(102, 126, 234, 0.3)',
                                borderRadius: '8px',
                            }}
                        />
                        <Legend />
                        {yKeys.map((key, index) => (
                            <Bar
                                key={key}
                                dataKey={key}
                                name={String(key).replace(/_/g, ' ')}
                                fill={COLORS[index % COLORS.length]}
                                radius={[4, 4, 0, 0]}
                            />
                        ))}
                    </BarChart>
                );
            }

            // ============== CLUSTERED BAR CHART (Horizontal, side by side) ==============
            case 'clustered_bar': {
                const yKeys = Array.isArray(config.yKey) ? config.yKey : [config.yKey || 'value'];
                return (
                    <BarChart
                        width={800}
                        height={400}
                        data={chartData}
                        layout="vertical"
                        margin={{ top: 20, right: 30, left: 100, bottom: 20 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                        <XAxis type="number" stroke="rgba(255,255,255,0.7)" tick={{ fill: 'rgba(255,255,255,0.7)' }} />
                        <YAxis
                            type="category"
                            dataKey={config.xKey}
                            stroke="rgba(255,255,255,0.7)"
                            tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 11 }}
                            width={90}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: '#1a1a2e',
                                border: '1px solid rgba(102, 126, 234, 0.3)',
                                borderRadius: '8px',
                            }}
                        />
                        <Legend />
                        {yKeys.map((key, index) => (
                            <Bar
                                key={key}
                                dataKey={key}
                                name={String(key).replace(/_/g, ' ')}
                                fill={COLORS[index % COLORS.length]}
                                radius={[0, 4, 4, 0]}
                            />
                        ))}
                    </BarChart>
                );
            }

            // ============== 100% STACKED COLUMN CHART ==============
            case 'stacked_100': {
                const yKeys = Array.isArray(config.yKey) ? config.yKey : [config.yKey || 'value'];

                // Calculate percentage for each row
                const percentData = chartData.map((row) => {
                    const total = yKeys.reduce((sum, key) => sum + (Number(row[key]) || 0), 0);
                    const newRow: Record<string, unknown> = { [config.xKey || 'name']: row[config.xKey || 'name'] };
                    yKeys.forEach((key) => {
                        newRow[key] = total > 0 ? ((Number(row[key]) || 0) / total) * 100 : 0;
                    });
                    return newRow;
                });

                return (
                    <BarChart
                        width={800}
                        height={400}
                        data={percentData}
                        margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                        <XAxis
                            dataKey={config.xKey}
                            stroke="rgba(255,255,255,0.7)"
                            tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 12 }}
                            interval={0}
                            angle={-45}
                            textAnchor="end"
                            height={80}
                        />
                        <YAxis
                            stroke="rgba(255,255,255,0.7)"
                            tick={{ fill: 'rgba(255,255,255,0.7)' }}
                            domain={[0, 100]}
                            tickFormatter={(value) => `${value}%`}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: '#1a1a2e',
                                border: '1px solid rgba(102, 126, 234, 0.3)',
                                borderRadius: '8px',
                            }}
                            formatter={(value) => [`${Number(value).toFixed(1)}%`, '']}
                        />
                        <Legend />
                        {yKeys.map((key, index) => (
                            <Bar
                                key={key}
                                dataKey={key}
                                name={String(key).replace(/_/g, ' ')}
                                stackId="stack1"
                                fill={COLORS[index % COLORS.length]}
                            />
                        ))}
                    </BarChart>
                );
            }

            // ============== WATERFALL CHART ==============
            case 'waterfall': {
                const yKey = getYKey();

                // Transform data for waterfall - calculate running total and differences
                let runningTotal = 0;
                const waterfallData = chartData.map((row, index) => {
                    const value = Number(row[yKey]) || 0;
                    const start = runningTotal;
                    runningTotal += value;
                    return {
                        ...row,
                        name: row[config.xKey || 'name'],
                        value: value,
                        start: start,
                        end: runningTotal,
                        fill: value >= 0 ? '#10b981' : '#ef4444', // Green for positive, red for negative
                    };
                });

                // Add total bar
                waterfallData.push({
                    name: 'Total',
                    value: runningTotal,
                    start: 0,
                    end: runningTotal,
                    fill: '#667eea',
                } as typeof waterfallData[0]);

                return (
                    <BarChart
                        width={800}
                        height={400}
                        data={waterfallData}
                        margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                        <XAxis
                            dataKey="name"
                            stroke="rgba(255,255,255,0.7)"
                            tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 11 }}
                            interval={0}
                            angle={-45}
                            textAnchor="end"
                            height={80}
                        />
                        <YAxis stroke="rgba(255,255,255,0.7)" tick={{ fill: 'rgba(255,255,255,0.7)' }} />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: '#1a1a2e',
                                border: '1px solid rgba(102, 126, 234, 0.3)',
                                borderRadius: '8px',
                            }}
                            formatter={(value) => [Number(value).toLocaleString(), 'Value']}
                        />
                        <Legend />
                        <ReferenceLine y={0} stroke="rgba(255,255,255,0.3)" />
                        <Bar dataKey="value" name="Change">
                            {waterfallData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))}
                        </Bar>
                    </BarChart>
                );
            }

            // ============== FUNNEL CHART ==============
            case 'funnel': {
                const yKey = getYKey();

                // Sort data by value descending for funnel effect
                const funnelData = [...chartData]
                    .map((row, index) => ({
                        name: String(row[config.xKey || 'name']),
                        value: Number(row[yKey]) || 0,
                        fill: COLORS[index % COLORS.length],
                    }))
                    .sort((a, b) => b.value - a.value);

                return (
                    <FunnelChart width={800} height={400}>
                        <Tooltip
                            contentStyle={{
                                backgroundColor: '#1a1a2e',
                                border: '1px solid rgba(102, 126, 234, 0.3)',
                                borderRadius: '8px',
                            }}
                        />
                        <Funnel
                            dataKey="value"
                            data={funnelData}
                            isAnimationActive
                        >
                            {funnelData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))}
                            <LabelList
                                position="center"
                                fill="#fff"
                                stroke="none"
                                dataKey="name"
                                fontSize={12}
                            />
                        </Funnel>
                    </FunnelChart>
                );
            }

            case 'table':
            default:
                return renderTable(chartData);
        }
    };

    const renderTable = (data: Record<string, unknown>[]) => {
        if (!data.length) {
            return <p className="text-gray-400">No data available</p>;
        }

        const columns = Object.keys(data[0]);

        return (
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-white/10">
                            {columns.map((col) => (
                                <th
                                    key={col}
                                    className="px-4 py-3 text-left text-sm font-semibold text-purple-300 uppercase tracking-wider"
                                >
                                    {col}
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
                                    <td key={col} className="px-4 py-3 text-sm text-gray-300">
                                        {String((row as Record<string, unknown>)[col] ?? '-')}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    };

    return (
        <div className="glass-card p-6">
            <h3 className="text-xl font-semibold mb-6 gradient-text">{config.title}</h3>
            <div style={{ width: '100%', minHeight: 400 }}>
                {renderChart()}
            </div>
        </div>
    );
}

export default ChartRenderer;
