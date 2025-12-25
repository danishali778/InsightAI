/**
 * StepLogger Component
 * Displays real-time workflow steps with animations
 */

import { useEffect, useRef } from 'react';

interface StepLoggerProps {
    steps: string[];
    isLoading: boolean;
}

export function StepLogger({ steps, isLoading }: StepLoggerProps) {
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [steps]);

    if (steps.length === 0 && !isLoading) {
        return null;
    }

    return (
        <div className="glass-card p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <span className="text-2xl">🔄</span>
                <span className="gradient-text">Workflow Progress</span>
            </h3>

            <div
                ref={scrollRef}
                className="max-h-64 overflow-y-auto space-y-2"
            >
                {steps.map((step, index) => (
                    <div
                        key={index}
                        className="flex items-start gap-3 py-2 px-3 rounded-lg bg-white/5 animate-slide-in"
                        style={{ animationDelay: `${index * 50}ms` }}
                    >
                        <span className="text-sm opacity-40 font-mono w-6">
                            {String(index + 1).padStart(2, '0')}
                        </span>
                        <span className="text-sm">{step}</span>
                    </div>
                ))}

                {isLoading && (
                    <div className="flex items-center gap-3 py-2 px-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
                        <div className="w-6 flex justify-center">
                            <span className="inline-block w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
                        </div>
                        <span className="text-sm text-purple-300">Processing...</span>
                    </div>
                )}
            </div>
        </div>
    );
}

export default StepLogger;
