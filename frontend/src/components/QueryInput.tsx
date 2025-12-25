/**
 * QueryInput Component
 * Natural language question input with submit button
 */

import { useState } from 'react';
import type { FormEvent } from 'react';

interface QueryInputProps {
    onSubmit: (question: string) => void;
    isLoading: boolean;
}

export function QueryInput({ onSubmit, isLoading }: QueryInputProps) {
    const [question, setQuestion] = useState('');

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (question.trim() && !isLoading) {
            onSubmit(question.trim());
        }
    };

    const exampleQuestions = [
        "Show me total sales by category",
        "What are the top 10 customers by revenue?",
        "Display monthly orders trend",
        "How many products are in each category?",
    ];

    return (
        <div className="glass-card p-6 mb-6">
            <form onSubmit={handleSubmit}>
                <label className="block mb-2 text-sm font-medium text-gray-400">
                    Ask a question about your data
                </label>
                <div className="flex gap-4">
                    <input
                        type="text"
                        value={question}
                        onChange={(e) => setQuestion(e.target.value)}
                        placeholder="e.g., Show me total sales by product category..."
                        className="input-glass flex-1"
                        disabled={isLoading}
                    />
                    <button
                        type="submit"
                        disabled={isLoading || !question.trim()}
                        className="btn-primary flex items-center gap-2 whitespace-nowrap"
                    >
                        {isLoading ? (
                            <>
                                <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Analyzing...
                            </>
                        ) : (
                            <>
                                <span>✨</span>
                                Analyze
                            </>
                        )}
                    </button>
                </div>
            </form>

            {!isLoading && (
                <div className="mt-4">
                    <p className="text-xs text-gray-500 mb-2">Try these examples:</p>
                    <div className="flex flex-wrap gap-2">
                        {exampleQuestions.map((q, i) => (
                            <button
                                key={i}
                                onClick={() => setQuestion(q)}
                                className="px-3 py-1 text-xs rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
                            >
                                {q}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

export default QueryInput;
