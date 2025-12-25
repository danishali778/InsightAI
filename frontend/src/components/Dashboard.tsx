/**
 * Dashboard Component
 * Main dashboard combining all UI components
 */

import { useState } from 'react';
import { QueryInput } from './QueryInput';
import { StepLogger } from './StepLogger';
import { ChartRenderer } from './ChartRenderer';
import { DataTable } from './DataTable';
import { ChartTypeSelector, type ChartType } from './ChartTypeSelector';
import { analyzeQuestion } from '../services/api';
import type { AnalyzeResponse } from '../services/api';

export function Dashboard() {
    const [isLoading, setIsLoading] = useState(false);
    const [steps, setSteps] = useState<string[]>([]);
    const [result, setResult] = useState<AnalyzeResponse | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [selectedChartType, setSelectedChartType] = useState<ChartType | null>(null);

    const handleSubmit = async (question: string) => {
        setIsLoading(true);
        setSteps([]);
        setResult(null);
        setError(null);
        setSelectedChartType(null); // Reset to AI default on new query

        try {
            // Add initial step
            setSteps(['🚀 Sending question to InsightAI...']);

            const response = await analyzeQuestion(question);

            // Update with all steps from response
            setSteps(response.steps);
            setResult(response);
            // Set default chart type from AI
            setSelectedChartType(response.visualization_config?.type as ChartType || 'bar');
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'An error occurred';
            setError(errorMessage);
            setSteps((prev) => [...prev, `❌ Error: ${errorMessage}`]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleChartTypeChange = (type: ChartType) => {
        setSelectedChartType(type);
    };

    // Get the effective visualization config with user-selected chart type
    const getEffectiveConfig = () => {
        if (!result?.visualization_config) return null;

        return {
            ...result.visualization_config,
            type: selectedChartType || result.visualization_config.type,
        };
    };

    const effectiveConfig = getEffectiveConfig();
    const aiRecommendedType = result?.visualization_config?.type as ChartType;
    const recommendedCharts = (result?.visualization_config?.recommended_charts || [aiRecommendedType]).filter(Boolean) as ChartType[];

    return (
        <div className="min-h-screen">
            {/* Background gradient orbs */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-600/20 rounded-full blur-3xl" />
                <div className="absolute top-1/2 -left-40 w-80 h-80 bg-blue-600/20 rounded-full blur-3xl" />
                <div className="absolute -bottom-40 right-1/3 w-80 h-80 bg-pink-600/10 rounded-full blur-3xl" />
            </div>

            {/* Content */}
            <div className="relative z-10 container mx-auto px-4 py-8 max-w-6xl">
                {/* Header */}
                <header className="text-center mb-12">
                    <h1 className="text-5xl font-bold mb-4">
                        <span className="gradient-text">InsightAI</span>
                    </h1>
                    <p className="text-xl text-gray-400">
                        Groq Speed Edition • Text-to-SQL Business Intelligence
                    </p>
                    <div className="flex items-center justify-center gap-4 mt-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                            Powered by Groq
                        </span>
                        <span>•</span>
                        <span>CrewAI Agents</span>
                        <span>•</span>
                        <span>LangGraph Workflow</span>
                    </div>
                </header>

                {/* Query Input */}
                <QueryInput onSubmit={handleSubmit} isLoading={isLoading} />

                {/* Step Logger */}
                <StepLogger steps={steps} isLoading={isLoading} />

                {/* Error Display */}
                {error && (
                    <div className="glass-card p-6 mb-6 border-red-500/30 bg-red-500/10">
                        <div className="flex items-center gap-3">
                            <span className="text-2xl">⚠️</span>
                            <div>
                                <h3 className="font-semibold text-red-400">Error</h3>
                                <p className="text-sm text-gray-400">{error}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Results */}
                {result && effectiveConfig && (
                    <div className="space-y-6 animate-slide-in">
                        {/* SQL Query Card */}
                        <div className="glass-card p-6">
                            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                                <span>📝</span>
                                <span className="gradient-text">Generated SQL</span>
                            </h3>
                            <pre className="bg-black/30 rounded-lg p-4 overflow-x-auto text-sm text-green-400 font-mono">
                                {result.sql_query}
                            </pre>
                        </div>

                        {/* Chart Type Selector */}
                        <div className="glass-card p-4">
                            <ChartTypeSelector
                                selectedType={selectedChartType || aiRecommendedType}
                                recommendedTypes={recommendedCharts}
                                onTypeChange={handleChartTypeChange}
                            />
                        </div>

                        {/* Visualization */}
                        <ChartRenderer config={effectiveConfig} />

                        {/* Data Table - Always visible */}
                        <div className="glass-card p-6">
                            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                                <span>📋</span>
                                <span className="gradient-text">Data Table</span>
                            </h3>
                            <div className="overflow-x-auto">
                                <DataTable data={(result.visualization_config?.data || []) as Record<string, unknown>[]} />
                            </div>
                        </div>

                        {/* Raw Results Toggle */}
                        <details className="glass-card p-6">
                            <summary className="cursor-pointer text-lg font-semibold flex items-center gap-2">
                                <span>📊</span>
                                <span className="gradient-text">Raw Query Results</span>
                            </summary>
                            <pre className="mt-4 bg-black/30 rounded-lg p-4 overflow-x-auto text-sm text-gray-400 font-mono max-h-64">
                                {result.results}
                            </pre>
                        </details>
                    </div>
                )}

                {/* Empty State */}
                {!result && !isLoading && !error && (
                    <div className="glass-card p-12 text-center">
                        <div className="text-6xl mb-4">💡</div>
                        <h3 className="text-xl font-semibold mb-2">Ready to Analyze</h3>
                        <p className="text-gray-400">
                            Enter a natural language question about your data to get started.
                        </p>
                    </div>
                )}

                {/* Footer */}
                <footer className="text-center mt-12 text-sm text-gray-600">
                    InsightAI v1.0 • Built with FastAPI, CrewAI, LangGraph & Recharts
                </footer>
            </div>
        </div>
    );
}

export default Dashboard;

