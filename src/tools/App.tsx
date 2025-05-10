```tsx
import React from 'react';
import { ICPVisualization } from './icp/ICPVisualization';

export default function App() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-4 md:p-8">
      <div className="w-full max-w-5xl">
        <h1 className="text-3xl font-bold mb-4">Iterative Closest Point Algorithm Visualization</h1>
        <p className="mb-6 text-muted-foreground">
          Draw two separate curves and see how the ICP algorithm aligns them. Use the controls to step through each
          iteration.
        </p>
        <ICPVisualization />
      </div>
    </main>
  );
}
```
