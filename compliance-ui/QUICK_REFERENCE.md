# Quick Reference Card

## 🎯 Architecture at a Glance

```
Main.tsx
   ↓
ApiProvider (Dependency Injection)
   ↓
App.tsx (Routes)
   ↓
Pages (Dashboard, Reports)
   ↓
Components (Smart + Presentational)
   ↓
Hooks (Custom state management)
   ↓
Services (API via IApiClient)
   ↓
Utils (Helper functions)
```

## 📁 File Locations

| What | Where |
|------|-------|
| API Interface | `src/services/interfaces/IApiClient.ts` |
| API Implementation | `src/services/implementations/AxiosApiClient.ts` |
| API Factory | `src/services/api.ts` |
| DI Provider | `src/providers/ApiProvider.tsx` |
| Data Hooks | `src/hooks/useRuns.ts`, etc. |
| Mutation Hooks | `src/hooks/useMutations.ts` |
| UI Hooks | `src/hooks/useAlert.ts`, etc. |
| Utilities | `src/utils/fileUtils.ts`, etc. |
| Presentational | `src/components/presentational/` |
| Layout | `src/components/layout/` |
| Smart Components | `src/components/` |
| Pages | `src/pages/` |

## 🔗 Import Patterns

### Get API Client
```typescript
import { useApiClient } from '../providers';
const apiClient = useApiClient();
```

### Use Data Hooks
```typescript
import { useRuns, useReports } from '../hooks';
const { data: runs } = useRuns(apiClient);
const { data: reports } = useReportsByRun(apiClient, runId);
```

### Use Mutations
```typescript
import { useExecuteRun } from '../hooks';
const mutation = useExecuteRun(apiClient);
mutation.mutate({ reviewedDate, mode, dryRun });
```

### Use UI State
```typescript
import { useAlert, useDragAndDrop } from '../hooks';
const { alert, showAlert } = useAlert(3000);
const { dragActive, handleDrag } = useDragAndDrop();
```

### Use Utilities
```typescript
import { extractErrorMessage, isValidCsvFile, downloadFile } from '../utils';
```

### Use Presentational Components
```typescript
import { FileUploadDropZone, RunExecutorForm } from '../components/presentational';
```

### Use Layout Components
```typescript
import { Navigation, Footer } from '../components/layout';
```

## 🎨 Component Types

| Type | Purpose | Location | Contains |
|------|---------|----------|----------|
| **Page** | Full page views | `pages/` | Routes, page layout |
| **Smart** | Business logic | `components/` | State, API calls, child composition |
| **Presentational** | Pure UI | `components/presentational/` | Only props, rendering |
| **Layout** | App structure | `components/layout/` | Navigation, footer |

## 🪝 Hook Types

| Type | Purpose | Location | Returns |
|------|---------|----------|---------|
| **Query** | Data fetching | `hooks/useRuns.ts` | `{ data, isLoading, error }` |
| **Mutation** | Data modification | `hooks/useMutations.ts` | `{ mutate, isPending, isError }` |
| **UI State** | UI state | `hooks/useAlert.ts` | `{ state, handlers }` |
| **Helper** | Utility logic | `hooks/useAsync.ts` | Various by hook |

## 🛠️ Common Patterns

### 1. Add API Endpoint
```typescript
// 1. Add to IApiClient interface
async getNewEndpoint(): Promise<Data>;

// 2. Implement in AxiosApiClient
async getNewEndpoint(): Promise<Data> {
    const { data } = await this.api.get('/endpoint');
    return data;
}

// 3. Create hook
export function useNewEndpoint(apiClient: IApiClient) {
    return useQuery({
        queryKey: ['endpoint'],
        queryFn: () => apiClient.getNewEndpoint(),
    });
}

// 4. Use in component
const { data } = useNewEndpoint(apiClient);
```

### 2. Create Container Component
```typescript
export function MyComponent({ onSuccess }: Props) {
    const apiClient = useApiClient();
    const { data, isLoading } = useMyData(apiClient);
    
    return <MyPresentationalComponent data={data} isLoading={isLoading} />;
}
```

### 3. Create Presentational Component
```typescript
export interface MyComponentProps {
    data: Data;
    isLoading: boolean;
}

export function MyComponent({ data, isLoading }: MyComponentProps) {
    return <div>{isLoading ? 'Loading...' : data.name}</div>;
}
```

### 4. Handle Errors
```typescript
import { extractErrorMessage } from '../utils';

try {
    await mutation.mutate(payload);
} catch (error) {
    const message = extractErrorMessage(error, 'Operation failed');
    showAlert('error', message);
}
```

### 5. Handle Files
```typescript
import { isValidCsvFile, downloadFile } from '../utils';

if (isValidCsvFile(file)) {
    // Process file
}

downloadFile(blob, 'filename.csv');
```

## 📋 Testing Template

```typescript
// Presentational component
describe('MyComponent', () => {
    it('should render with props', () => {
        render(<MyComponent data={data} onClick={jest.fn()} />);
        expect(screen.getByText('text')).toBeInTheDocument();
    });
});

// Container component
describe('MyContainer', () => {
    it('should handle mutation', async () => {
        const mockClient = new MockApiClient();
        render(
            <ApiProvider apiClient={mockClient}>
                <MyContainer />
            </ApiProvider>
        );
        expect(await screen.findByText('success')).toBeInTheDocument();
    });
});

// Custom hook
describe('useMyHook', () => {
    it('should fetch data', async () => {
        const mockClient = new MockApiClient();
        const { result } = renderHook(() => useMyHook(mockClient));
        
        await waitFor(() => {
            expect(result.current.data).toBeDefined();
        });
    });
});
```

## ⚡ Performance Tips

```typescript
// 1. Memoize presentational components
export const MyComponent = React.memo(({ ... }) => { ... });

// 2. Use useCallback for handlers
const handleClick = useCallback(() => { ... }, [deps]);

// 3. Use useMemo for expensive computations
const computed = useMemo(() => expensive(data), [data]);

// 4. Lazy load routes
const Dashboard = lazy(() => import('./Dashboard'));

// 5. Code split by feature
```

## 🐛 Debugging Checklist

- [ ] Is ApiProvider wrapping the component?
- [ ] Is the apiClient passed to the hook?
- [ ] Is the queryKey unique?
- [ ] Is the enabled condition correct?
- [ ] Are dependencies correct?
- [ ] Is the error being caught?
- [ ] Are types correct?
- [ ] Is the component exported?

## ✅ Code Review Checklist

- [ ] Uses custom hooks (not direct useQuery)
- [ ] Uses dependency injection (not hard imports)
- [ ] Presentational components are pure
- [ ] Container components handle logic
- [ ] Props are segregated
- [ ] Errors are handled
- [ ] Loading states shown
- [ ] TypeScript strict mode passes
- [ ] No console errors/warnings
- [ ] Follows naming conventions

## 📚 Documentation

| Document | Read Time | Best For |
|----------|-----------|----------|
| REFACTORING_COMPLETE.md | 5 min | Overview |
| DEVELOPER_GUIDE.md | 25 min | Hands-on tasks |
| ARCHITECTURE.md | 30 min | Understanding |
| BEST_PRACTICES.md | 20 min | Development |
| REFACTORING_SUMMARY.md | 15 min | Migration |

## 🆘 Common Issues

| Issue | Solution |
|-------|----------|
| "useApiClient must be used within ApiProvider" | Wrap component with `<ApiProvider>` in main.tsx |
| Cannot find module | Check import path and file exists |
| Hook rules error | Ensure hook called at top level, not in conditions |
| Query not updating | Check queryKey is unique, invalidate in mutation |
| Type error on props | Check interface matches usage |
| Component not rendering | Check enabled condition, loading state |

## 🎯 Best Practices Checklist

- [ ] Each hook handles ONE concern
- [ ] Each component has ONE responsibility
- [ ] Props are properly typed and segregated
- [ ] Errors are centrally handled
- [ ] Utilities are reusable
- [ ] Dependencies are injected
- [ ] Components are composable
- [ ] Code is testable
- [ ] Types are explicit
- [ ] No hard-coded values

---

**Print this page for quick reference!** 🖨️
