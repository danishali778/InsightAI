declare module 'react-grid-layout' {
  import * as React from 'react';

  export interface Layout {
    i: string;
    x: number;
    y: number;
    w: number;
    h: number;
    minW?: number;
    maxW?: number;
    minH?: number;
    maxH?: number;
  }

  export interface Layouts {
    [key: string]: Layout[];
  }

  export interface ResponsiveProps {
    layouts?: Layouts;
    breakpoints?: Record<string, number>;
    cols?: Record<string, number>;
    rowHeight?: number;
    margin?: [number, number];
    containerPadding?: [number, number];
    draggableHandle?: string;
    onLayoutChange?: (currentLayout: Layout[], allLayouts: Layouts) => void;
    children?: React.ReactNode;
  }

  export class Responsive extends React.Component<ResponsiveProps> {}
  export function WidthProvider<T>(component: T): T;
}
