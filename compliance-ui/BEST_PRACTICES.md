# Best Practices Guide

## Component Development

### 1. Container vs Presentational Components

**Presentational Components** (in `components/presentational/`)
- Pure functions that take props and render UI
- No hooks (except built-in React hooks like `useState` for UI state)
- No API calls
- Fully reusable and testable
- Example: `FileUploadDropZone.tsx`

```typescript
// ✅ Good - Presentational Component
export function FileUploadDropZone({ isLoading, onDrop, onChange }: Props) {
    return (
        <div onDrop={onDrop} onChange={onChange}>
            {/* Pure UI */}
        </div>
    );
}
```

**Container Components** (in `components/`)
- Manage business logic and state
- Use custom hooks for data fetching
- Compose presentational components
- Not directly exported for reuse
- Example: `FileUpload.tsx`

```typescript
// ✅ Good - Container Component
export function FileUpload({ onSuccess, onError }: FileUploadProps) {
    const apiClient = useApiClient();
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const mutation = useImportHireData(apiClient);
    
    return <FileUploadDropZone ... />;
}
```

### 2. Component Composition

```typescript
// ✅ Good - Compose small, focused components
<FileUploadDropZone onDrop={handleDrop} />
<FileInfo fileName={selectedFile.name} onImport={handleImport} />

// ❌ Avoid - Monolithic components
<div>
    {/* Hundreds of lines of UI code */}
</div>
```

### 3. Props Interfaces

```typescript
// ✅ Good - Focused, segregated props
interface FileUploadDropZoneProps {
    isLoading: boolean;
    onDragEnter: (e: React.DragEvent) => void;
    onDrop: (e: React.DragEvent) => void;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

// ❌ Avoid - Large, god-like prop objects
interface FileUploadProps {
    data: any;
    error: any;
    loading: boolean;
    onAnything: Function;
    onEverything: Function;
    // ... 20 more props
}
```

## Hooks Development

### 1. Single Responsibility

```typescript
// ✅ Good - Each hook has one job
export function useModes(apiClient: IApiClient) {
    return useQuery({
        queryKey: ['modes'],
        queryFn: () => apiClient.getModes(),
    });
}

// ❌ Avoid - Hook doing multiple things
export function useEverything(apiClient: IApiClient) {
    const modes = useQuery({ ... });
    const reports = useQuery({ ... });
    const runs = useQuery({ ... });
    const alert = useState({ ... });
    // ... many more concerns
}
```

### 2. Dependency Injection

```typescript
// ✅ Good - Inject dependencies
export function useReports(apiClient: IApiClient, runId: number) {
    return useQuery({
        queryFn: () => apiClient.getReportsByRun(runId),
    });
}

// ❌ Avoid - Direct imports of singletons
export function useReports(runId: number) {
    return useQuery({
        queryFn: () => apiService.getReportsByRun(runId), // Hard to test
    });
}
```

### 3. Custom Hook Naming

```typescript
// ✅ Good - Clear, descriptive names
- useRuns
- useReportsByRun
- useImportHireData
- useMutations
- useAlert
- useDragAndDrop

// ❌ Avoid - Vague names
- useData
- useFetch
- useStuff
- useAsync2 // Multiple similar hooks
```

## API Layer

### 1. Interface-Based Design

```typescript
// ✅ Good - Depend on interface
export function FileUpload() {
    const apiClient = useApiClient(); // IApiClient type
    const mutation = useImportHireData(apiClient);
}

// ❌ Avoid - Depend on concrete class
import { apiService } from '../services/api';
export function FileUpload() {
    const mutation = useMutation({
        mutationFn: (file) => apiService.importHireData(file), // Tightly coupled
    });
}
```

### 2. Error Handling

```typescript
// ✅ Good - Use utility functions for error handling
import { extractErrorMessage } from '../utils/errorUtils';

export function FileUpload({ onError }: Props) {
    const mutation = useImportHireData(apiClient);
    
    if (mutation.isError) {
        const message = extractErrorMessage(mutation.error, 'Upload failed');
        onError?.(message);
    }
}

// ❌ Avoid - Inline error handling logic
if (mutation.isError) {
    const message = mutation.error?.response?.data?.error 
        || mutation.error?.message 
        || 'Unknown error'; // Repeated everywhere
    onError?.(message);
}
```

## State Management

### 1. Use Custom Hooks for Reusable State

```typescript
// ✅ Good - Reusable alert logic
const { alert, showAlert, clearAlert } = useAlert(3000);

// ❌ Avoid - Duplicated state logic
const [alert, setAlert] = useState(null);
const [timer, setTimer] = useState(null);
useEffect(() => {
    // Duplicate dismiss logic everywhere
}, []);
```

### 2. Use Context for Dependency Injection

```typescript
// ✅ Good - Easy to test with mocks
<ApiProvider apiClient={mockClient}>
    <Dashboard />
</ApiProvider>

// ❌ Avoid - Hard to test
// No way to inject mock without modifying component
```

## TypeScript

### 1. Export Interfaces with Components

```typescript
// ✅ Good - Types and components together
export function FileUploadDropZone(props: FileUploadDropZoneProps) { ... }
export interface FileUploadDropZoneProps { ... }

// ❌ Avoid - Types scattered in separate files or not exported
```

### 2. Use Type Inference

```typescript
// ✅ Good - Let TypeScript infer
const [selected, setSelected] = useState<File | null>(null);
const modes = useModes(apiClient); // Type inferred from hook

// ❌ Avoid - Overly explicit types
const modes: ComplianceMode[] = useModes(apiClient);
const [x]: [any, Function] = useState();
```

## File Organization

### 1. Co-locate Related Files

```
components/
  FileUpload.tsx           # Container component
  presentational/
    FileUploadDropZone.tsx # Presentational components
    FileInfo.tsx
    index.ts
```

### 2. Centralized Exports

```typescript
// ✅ Good - Import from index
import { FileUploadDropZone, FileInfo } from '../components/presentational';

// ❌ Avoid - Deep imports
import { FileUploadDropZone } from '../components/presentational/FileUploadDropZone';
```

## Testing Recommendations

### 1. Test Presentational Components in Isolation

```typescript
describe('FileUploadDropZone', () => {
    it('should call onDrop when files are dropped', () => {
        const onDrop = jest.fn();
        render(<FileUploadDropZone onDrop={onDrop} ... />);
        // Test UI interaction
    });
});
```

### 2. Test Container Components with Mock Provider

```typescript
describe('FileUpload', () => {
    it('should import file successfully', async () => {
        const mockApiClient = new MockApiClient();
        render(
            <ApiProvider apiClient={mockApiClient}>
                <FileUpload onSuccess={jest.fn()} />
            </ApiProvider>
        );
        // Test business logic
    });
});
```

### 3. Test Custom Hooks in Isolation

```typescript
describe('useAlert', () => {
    it('should dismiss alert after timeout', () => {
        const { result } = renderHook(() => useAlert(100));
        act(() => result.current.showAlert('success', 'Test'));
        // Wait and verify
    });
});
```

## Performance Optimization

### 1. Use React.memo for Presentational Components

```typescript
// ✅ Good - Prevent unnecessary re-renders
export const FileUploadDropZone = React.memo(({ ... }: Props) => {
    return { ... };
});
```

### 2. Use useCallback for Handlers

```typescript
// ✅ Good - Stable function references
const handleDrop = useCallback((e: React.DragEvent) => {
    // Handle drop
}, []);
```

### 3. Code Splitting

```typescript
// ✅ Good - Lazy load routes
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Reports = lazy(() => import('./pages/Reports'));
```

## Common Mistakes to Avoid

### ❌ Don't Do These

1. **Mixing business logic with presentational components**
   ```typescript
   // Bad
   export function Component() {
       const data = apiService.getData(); // Business logic in presentational
       return <div>{data}</div>;
   }
   ```

2. **Creating hooks that do too much**
   ```typescript
   // Bad
   export function useEverything() {
       return { data1, data2, data3, ... } // Multiple concerns
   }
   ```

3. **Directly importing singletons instead of using DI**
   ```typescript
   // Bad
   import { apiService } from '../api';
   useQuery({ queryFn: () => apiService.getData() });
   ```

4. **Large prop objects instead of segregated interfaces**
   ```typescript
   // Bad
   interface ComponentProps {
       all: any; // Should be segregated
   }
   ```

5. **Hardcoding configuration values**
   ```typescript
   // Bad - Should be in configuration
   const API_URL = 'http://localhost:3001/api';
   const TIMEOUT = 5000;
   ```

## Summary

Follow these principles when developing:
- 🎯 Single Responsibility
- 🔄 Composition over Inheritance
- 📦 Dependency Injection
- 🧩 Reusable, Focused Components
- 📝 Clear Interfaces and Types
- ✅ Testable Code
- 🚀 Performance Conscious
