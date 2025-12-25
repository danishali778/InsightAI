/**
 * ChartTypeSelector Component
 * Hybrid approach: Show all charts, highlight recommended ones
 */

import { useState, useEffect } from 'react';

export type ChartType = 'bar' | 'line' | 'pie' | 'area' | 'scatter' | 'radar' | 'composed' | 'table'
    | 'stacked_bar' | 'stacked_column' | 'clustered_bar' | 'clustered_column' | 'stacked_100'
    | 'waterfall' | 'funnel';

interface ChartTypeSelectorProps {
    selectedType: ChartType;
    recommendedTypes: ChartType[];
    onTypeChange: (type: ChartType) => void;
}

const CHART_OPTIONS: { value: ChartType; label: string; icon: string }[] = [
    { value: 'bar', label: 'Bar', icon: '📊' },
    { value: 'line', label: 'Line', icon: '📈' },
    { value: 'pie', label: 'Pie', icon: '🥧' },
    { value: 'area', label: 'Area', icon: '📉' },
    { value: 'scatter', label: 'Scatter', icon: '⭐' },
    { value: 'radar', label: 'Radar', icon: '🕸️' },
    { value: 'composed', label: 'Combo', icon: '📊📈' },
    { value: 'stacked_column', label: 'Stacked', icon: '📊▲' },
    { value: 'stacked_bar', label: 'Stacked Bar', icon: '📊◀' },
    { value: 'clustered_column', label: 'Clustered', icon: '📊📊' },
    { value: 'clustered_bar', label: 'Clustered Bar', icon: '▐▐' },
    { value: 'stacked_100', label: '100% Stacked', icon: '📊%' },
    { value: 'waterfall', label: 'Waterfall', icon: '🌊' },
    { value: 'funnel', label: 'Funnel', icon: '🔻' },
    { value: 'table', label: 'Table', icon: '📋' },
];

export function ChartTypeSelector({ selectedType, recommendedTypes, onTypeChange }: ChartTypeSelectorProps) {
    const [currentType, setCurrentType] = useState<ChartType>(selectedType);

    useEffect(() => {
        setCurrentType(selectedType);
    }, [selectedType]);

    const handleSelect = (type: ChartType) => {
        setCurrentType(type);
        onTypeChange(type);
    };

    const isRecommended = (type: ChartType) => recommendedTypes.includes(type);
    const isAIPick = (type: ChartType) => recommendedTypes[0] === type;

    // Sort options: recommended first, then others
    const sortedOptions = [...CHART_OPTIONS].sort((a, b) => {
        const aRec = isRecommended(a.value) ? 0 : 1;
        const bRec = isRecommended(b.value) ? 0 : 1;
        return aRec - bRec;
    });

    return (
        <div className="space-y-3">
            <div className="flex items-center gap-2">
                <span className="text-sm text-gray-400">Visualization Type</span>
                <span className="text-xs text-purple-400">
                    ({recommendedTypes.length} recommended)
                </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
                {sortedOptions.map((option) => {
                    const recommended = isRecommended(option.value);
                    const aiPick = isAIPick(option.value);
                    const selected = currentType === option.value;

                    return (
                        <button
                            key={option.value}
                            onClick={() => handleSelect(option.value)}
                            className={`
                                flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium 
                                transition-all duration-200 border
                                ${selected
                                    ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg shadow-purple-500/25 border-transparent'
                                    : recommended
                                        ? 'bg-purple-500/10 text-purple-200 border-purple-500/30 hover:bg-purple-500/20'
                                        : 'bg-white/5 text-gray-500 border-white/5 hover:bg-white/10 hover:text-gray-300'
                                }
                            `}
                        >
                            <span className={recommended ? '' : 'opacity-50'}>{option.icon}</span>
                            <span>{option.label}</span>
                            {aiPick && selected && (
                                <span className="ml-1 text-xs">✨</span>
                            )}
                            {recommended && !selected && (
                                <span className="ml-1 w-1.5 h-1.5 bg-purple-400 rounded-full"></span>
                            )}
                        </button>
                    );
                })}
            </div>

            <div className="flex items-center gap-4 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-purple-400 rounded-full"></span>
                    Recommended for this data
                </span>
                <span className="flex items-center gap-1">
                    <span className="opacity-50">📊</span>
                    Other options
                </span>
            </div>
        </div>
    );
}

export default ChartTypeSelector;
