import { useState, useRef, useCallback, useEffect } from 'react';
import { ResultsTable } from './ResultsTable';
import { ChartBlock } from './ChartBlock';

interface ChartRecommendation {
    type: 'bar' | 'line' | 'pie' | 'scatter' | 'area';
    x_column: string;
    y_columns: string[];
    title: string;
    x_label: string;
    y_label: string;
}

interface ResultsPanelProps {
    columns: string[];
    rows: Record<string, unknown>[];
    rowCount: number;
    truncated?: boolean;
    executionTimeMs?: number;
    chartRecommendation?: ChartRecommendation;
    onClose: () => void;
    panelHeight: number;
    onResize: (height: number) => void;
}

export function ResultsPanel({
    columns, rows, rowCount, truncated, executionTimeMs,
    chartRecommendation, onClose, panelHeight, onResize
}: ResultsPanelProps) {
    const [activeTab, setActiveTab] = useState<'table' | 'chart'>(
        chartRecommendation ? 'chart' : 'table'
    );
    const isDragging = useRef(false);
    const startY = useRef(0);
    const startHeight = useRef(0);

    const hasChart = chartRecommendation && rows.length > 1;

    // Reset active tab when data changes
    useEffect(() => {
        setActiveTab(chartRecommendation && rows.length > 1 ? 'chart' : 'table');
    }, [chartRecommendation, rows]);

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        isDragging.current = true;
        startY.current = e.clientY;
        startHeight.current = panelHeight;
        document.body.style.cursor = 'row-resize';
        document.body.style.userSelect = 'none';

        const handleMouseMove = (e: MouseEvent) => {
            if (!isDragging.current) return;
            const diff = startY.current - e.clientY;
            const newHeight = Math.max(180, Math.min(window.innerHeight * 0.7, startHeight.current + diff));
            onResize(newHeight);
        };

        const handleMouseUp = () => {
            isDragging.current = false;
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    }, [panelHeight, onResize]);

    return (
        <div style={{
            height: panelHeight,
            borderTop: '2px solid #e8e4dc',
            background: '#fff',
            display: 'flex',
            flexDirection: 'column',
            flexShrink: 0,
            fontFamily: "'DM Sans', sans-serif",
            boxShadow: '0 -4px 20px rgba(0,0,0,0.04)',
        }}>
            {/* Drag handle */}
            <div
                onMouseDown={handleMouseDown}
                style={{
                    height: 6,
                    background: '#faf8f5',
                    cursor: 'row-resize',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                }}
            >
                <div style={{
                    width: 40,
                    height: 3,
                    borderRadius: 2,
                    background: '#d0cdc6',
                    transition: 'background 0.15s',
                }} />
            </div>

            {/* Header bar */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 20px',
                borderBottom: '1px solid #f0ede7',
                background: '#faf8f5',
                flexShrink: 0,
            }}>
                {/* Left: tabs */}
                <div style={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                    <button
                        onClick={() => setActiveTab('table')}
                        style={{
                            padding: '6px 16px',
                            borderRadius: '8px 8px 0 0',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            border: 'none',
                            transition: 'all 0.15s',
                            background: activeTab === 'table' ? '#fff' : 'transparent',
                            color: activeTab === 'table' ? '#6c5ce7' : '#9b9da8',
                            borderBottom: activeTab === 'table' ? '2px solid #6c5ce7' : '2px solid transparent',
                        }}
                    >
                        📋 Table
                        <span style={{
                            marginLeft: 6,
                            padding: '1px 7px',
                            borderRadius: 10,
                            fontSize: '0.68rem',
                            background: activeTab === 'table' ? '#f5f0ff' : '#f0ede7',
                            color: activeTab === 'table' ? '#6c5ce7' : '#9b9da8',
                            fontWeight: 700,
                        }}>
                            {rowCount}
                        </span>
                    </button>

                    {hasChart && (
                        <button
                            onClick={() => setActiveTab('chart')}
                            style={{
                                padding: '6px 16px',
                                borderRadius: '8px 8px 0 0',
                                fontSize: '0.8rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                                border: 'none',
                                transition: 'all 0.15s',
                                background: activeTab === 'chart' ? '#fff' : 'transparent',
                                color: activeTab === 'chart' ? '#6c5ce7' : '#9b9da8',
                                borderBottom: activeTab === 'chart' ? '2px solid #6c5ce7' : '2px solid transparent',
                            }}
                        >
                            📊 Chart
                        </button>
                    )}
                </div>

                {/* Right: meta + close */}
                <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                    {executionTimeMs !== undefined && executionTimeMs > 0 && (
                        <span style={{
                            fontSize: '0.72rem',
                            color: '#b0b2bc',
                            fontFamily: "'DM Mono', monospace",
                        }}>
                            ⚡ {executionTimeMs}ms
                        </span>
                    )}
                    <button
                        onClick={onClose}
                        style={{
                            width: 28,
                            height: 28,
                            borderRadius: 8,
                            border: '1px solid #e8e4dc',
                            background: '#fff',
                            color: '#9b9da8',
                            fontSize: '1rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.15s',
                            lineHeight: 1,
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = '#fef2f2'; e.currentTarget.style.color = '#dc2626'; e.currentTarget.style.borderColor = '#fecaca'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = '#9b9da8'; e.currentTarget.style.borderColor = '#e8e4dc'; }}
                        title="Close panel"
                    >
                        ✕
                    </button>
                </div>
            </div>

            {/* Body */}
            <div style={{ flex: 1, overflowY: 'auto', overflowX: 'auto' }}>
                {activeTab === 'table' && (
                    <div style={{ padding: '0' }}>
                        <ResultsTable
                            columns={columns}
                            rows={rows}
                            rowCount={rowCount}
                            truncated={truncated}
                        />
                    </div>
                )}

                {activeTab === 'chart' && hasChart && (
                    <div style={{ padding: '0' }}>
                        <ChartBlock
                            recommendation={chartRecommendation}
                            rows={rows}
                            columns={columns}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
