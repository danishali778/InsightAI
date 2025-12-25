/**
 * InsightAI - API Service
 * Handles communication with the FastAPI backend
 */

import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

export interface VisualizationConfig {
    type: 'bar' | 'line' | 'pie' | 'area' | 'scatter' | 'radar' | 'composed' | 'table' | 'error'
    | 'stacked_bar' | 'stacked_column' | 'clustered_bar' | 'clustered_column' | 'stacked_100'
    | 'waterfall' | 'funnel';
    title: string;
    xKey?: string;
    yKey?: string | string[];  // Can be single key or array for multi-metric charts
    data: unknown[];
    message?: string;
    recommended_charts?: string[];  // List of chart types recommended for this data
}

export interface AnalyzeResponse {
    question: string;
    sql_query: string;
    results: string;
    visualization_config: VisualizationConfig;
    steps: string[];
}

export interface SchemaResponse {
    schema_info: string;
}

/**
 * Analyze a natural language question
 */
export async function analyzeQuestion(question: string): Promise<AnalyzeResponse> {
    const response = await axios.post<AnalyzeResponse>(`${API_BASE_URL}/analyze`, {
        question,
    });
    return response.data;
}

/**
 * Get database schema information
 */
export async function getSchema(): Promise<SchemaResponse> {
    const response = await axios.get<SchemaResponse>(`${API_BASE_URL}/schema`);
    return response.data;
}

/**
 * Stream analysis via Server-Sent Events
 */
export function streamAnalysis(
    question: string,
    onStep: (step: string) => void,
    onResult: (result: AnalyzeResponse) => void,
    onError: (error: string) => void
): () => void {
    const eventSource = new EventSource(
        `${API_BASE_URL}/analyze/stream?question=${encodeURIComponent(question)}`
    );

    eventSource.onmessage = (event) => {
        try {
            const data = JSON.parse(event.data);

            if (data.type === 'step') {
                onStep(data.data);
            } else if (data.type === 'result') {
                onResult(data.data);
                eventSource.close();
            } else if (data.type === 'error') {
                onError(data.data);
                eventSource.close();
            }
        } catch (e) {
            console.error('Failed to parse SSE data:', e);
        }
    };

    eventSource.onerror = () => {
        onError('Connection lost');
        eventSource.close();
    };

    // Return cleanup function
    return () => eventSource.close();
}

export default {
    analyzeQuestion,
    getSchema,
    streamAnalysis,
};
