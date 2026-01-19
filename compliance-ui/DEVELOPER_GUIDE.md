# Developer Quick Start Guide

## Getting Started with the New Architecture

### For New Developers

1. **Understand the Architecture**
   - Read `ARCHITECTURE.md` (10 min)
   - Review `BEST_PRACTICES.md` (10 min)
   - Scan `REFACTORING_SUMMARY.md` (5 min)

2. **Explore the Codebase**
   - Look at `src/providers/` - Understand dependency injection
   - Look at `src/hooks/` - See how state is managed
   - Look at `src/components/presentational/` - See UI components
   - Look at `src/components/` - See container components

3. **Create Your First Component**
   - Follow the pattern in `FileUpload.tsx`
   - Use hooks from `src/hooks/`
   - Extract UI to `src/components/presentational/`

## Common Tasks

### Adding a New API Endpoint

1. **Add to Interface** (`src/services/interfaces/IApiClient.ts`)
```typescript
export interface IApiClient {
    // ... existing methods
    
    // Your new method
    getNewData(id: number): Promise<YourDataType>;
}
```

2. **Implement** (`src/services/implementations/AxiosApiClient.ts`)
```typescript
export class AxiosApiClient implements IApiClient {
    // ... existing methods
    
    async getNewData(id: number): Promise<YourDataType> {
        const { data } = await this.api.get<YourDataType>(`/endpoint/${id}`);
        return data;
    }
}
```

3. **Create Hook** (`src/hooks/useNewData.ts`)
```typescript
import { useQuery } from '@tanstack/react-query';
import type { IApiClient } from '../services/interfaces/IApiClient';
import type { YourDataType } from '../types';

export function useNewData(apiClient: IApiClient, id: number) {
    return useQuery({
        queryKey: ['newData', id],
        queryFn: () => apiClient.getNewData(id),
        enabled: !!id,
    });
}
```

4. **Export Hook** (Update `src/hooks/index.ts`)
```typescript
export { useNewData } from './useNewData';
```

5. **Use in Component**
```typescript
import { useNewData } from '../hooks';
import { useApiClient } from '../providers';

export function MyComponent() {
    const apiClient = useApiClient();
    const { data, isLoading, error } = useNewData(apiClient, 123);
    
    if (isLoading) return <div>Loading...</div>;
    if (error) return <div>Error: {error.message}</div>;
    
    return <div>{/* Render data */}</div>;
}
```

### Adding a New Page

1. **Create Page Component** (`src/pages/MyPage.tsx`)
```typescript
import { useApiClient } from '../providers';
import { useMyData } from '../hooks';

export function MyPage() {
    const apiClient = useApiClient();
    const { data } = useMyData(apiClient);
    
    return (
        <div className="my-page">
            <h1>My Page</h1>
            {/* Page content */}
        </div>
    );
}
```

2. **Add Route** (Update `src/App.tsx`)
```typescript
const NAV_LINKS: NavLink[] = [
    { path: '/', label: 'Dashboard', icon: <Settings /> },
    { path: '/reports', label: 'Reports', icon: <FileText /> },
    { path: '/mypage', label: 'My Page', icon: <MyIcon /> },  // New
];

// In Routes
<Route path="/mypage" element={<MyPage />} />
```

### Creating a New Component

1. **Plan the Component**
   - Decide if it needs business logic (container) or just rendering (presentational)
   - Identify what props it needs
   - Identify what it should do/render

2. **Create Presentational Component** (if needed)
```typescript
// src/components/presentational/MyComponent.tsx
export interface MyComponentProps {
    title: string;
    onClick: () => void;
    isLoading?: boolean;
}

export function MyComponent({ title, onClick, isLoading }: MyComponentProps) {
    return (
        <div>
            <h3>{title}</h3>
            <button onClick={onClick} disabled={isLoading}>
                {isLoading ? 'Loading...' : 'Click me'}
            </button>
        </div>
    );
}
```

3. **Create Container Component** (if needed)
```typescript
// src/components/MyComponentContainer.tsx
import { useCallback } from 'react';
import { useMyData } from '../hooks';
import { useApiClient } from '../providers';
import { MyComponent } from './presentational';

export function MyComponentContainer() {
    const apiClient = useApiClient();
    const { data, isLoading } = useMyData(apiClient);
    
    const handleClick = useCallback(() => {
        // Handle click
    }, []);
    
    return (
        <MyComponent
            title="My Component"
            onClick={handleClick}
            isLoading={isLoading}
        />
    );
}
```

4. **Update Index** (`src/components/presentational/index.ts`)
```typescript
export { MyComponent } from './MyComponent';
export type { MyComponentProps } from './MyComponent';
```

### Writing Tests

1. **Test Presentational Component**
```typescript
// src/components/presentational/__tests__/MyComponent.test.tsx
import { render, screen } from '@testing-library/react';
import { MyComponent } from '../MyComponent';

describe('MyComponent', () => {
    it('should render title', () => {
        render(<MyComponent title="Test" onClick={jest.fn()} />);
        expect(screen.getByText('Test')).toBeInTheDocument();
    });
    
    it('should call onClick when clicked', () => {
        const onClick = jest.fn();
        render(<MyComponent title="Test" onClick={onClick} />);
        screen.getByText('Click me').click();
        expect(onClick).toHaveBeenCalled();
    });
});
```

2. **Test Container Component with Mock Provider**
```typescript
// src/components/__tests__/MyComponentContainer.test.tsx
import { render, screen } from '@testing-library/react';
import { ApiProvider } from '../providers';
import { MyComponentContainer } from '../MyComponentContainer';

// Mock API client
class MockApiClient implements IApiClient {
    getMyData() {
        return Promise.resolve({ /* mock data */ });
    }
    // ... implement other methods
}

describe('MyComponentContainer', () => {
    it('should display data', async () => {
        const mockClient = new MockApiClient();
        render(
            <ApiProvider apiClient={mockClient}>
                <MyComponentContainer />
            </ApiProvider>
        );
        expect(await screen.findByText('expected')).toBeInTheDocument();
    });
});
```

3. **Test Custom Hook**
```typescript
// src/hooks/__tests__/useMyData.test.ts
import { renderHook, waitFor } from '@testing-library/react';
import { useMyData } from '../useMyData';

describe('useMyData', () => {
    it('should fetch data', async () => {
        const mockClient = new MockApiClient();
        const { result } = renderHook(() => useMyData(mockClient, 1));
        
        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });
        
        expect(result.current.data).toBeDefined();
    });
});
```

## Debugging Tips

### Using React DevTools
1. Install React DevTools browser extension
2. Inspect components in "Components" tab
3. Check props and hooks in side panel

### Using Redux DevTools (if added)
1. Install Redux DevTools browser extension
2. Track state changes over time

### Common Issues

**Problem**: "Cannot find module 'useApiClient'"
```
Solution: Make sure ApiProvider wraps your component tree in main.tsx
```

**Problem**: "useApiClient must be used within ApiProvider"
```
Solution: Check that your component is rendered inside <ApiProvider>
```

**Problem**: Queries aren't working
```
Solution: Check that apiClient is passed to the hook
useMyData(apiClient, id)  // ✅ Correct
useMyData(id)             // ❌ Missing apiClient
```

**Problem**: Component not updating when data changes
```
Solution: 
1. Make sure you're using the hook with correct queryKey
2. Check if queryClient is invalidating cache correctly
3. Ensure mutation callbacks are updating cache
```

## Code Style Guidelines

### Naming Conventions

```typescript
// ✅ Good
const user = { name: 'John' };
function getUserById(id: number) { }
const isLoading = true;
const handleClick = () => { };
const useCustomHook = () => { };

// ❌ Avoid
const u = { n: 'John' };
function GetUserById(id: number) { }
const loading = true;
const onClick = () => { };
const CustomHook = () => { };
```

### File Naming

```
// ✅ Good
- useMyHook.ts
- MyComponent.tsx
- fileUtils.ts
- IApiClient.ts
- AxiosApiClient.ts

// ❌ Avoid
- my-hook.ts
- myComponent.tsx
- file_utils.ts
- apiClient.ts (no I prefix for interfaces)
- HttpApiClient.ts (specific implementation)
```

### Import Organization

```typescript
// ✅ Good - Organized by category
// 1. React & External libraries
import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';

// 2. Internal imports (types)
import type { IApiClient } from '../services/interfaces/IApiClient';

// 3. Internal imports (components)
import { MyComponent } from '../components/presentational';

// 4. Internal imports (hooks)
import { useMyData } from '../hooks';

// 5. Styles
import './MyComponent.css';
```

## Performance Best Practices

### Use React.memo for Expensive Presentational Components
```typescript
export const MyComponent = React.memo(function MyComponent(props: Props) {
    return { /* ... */ };
});
```

### Use useCallback for Event Handlers
```typescript
const handleClick = useCallback(() => {
    // handle click
}, [dependencies]);
```

### Use useMemo for Expensive Computations
```typescript
const computedValue = useMemo(() => {
    return expensiveComputation(data);
}, [data]);
```

## Resources

- **React Documentation**: https://react.dev
- **React Query Documentation**: https://tanstack.com/query/latest
- **TypeScript Handbook**: https://www.typescriptlang.org/docs/
- **SOLID Principles**: https://en.wikipedia.org/wiki/SOLID

## Getting Help

1. Check `ARCHITECTURE.md` for design patterns
2. Check `BEST_PRACTICES.md` for guidelines
3. Look at existing component implementations
4. Ask team members for clarification
5. Check error messages carefully

## Quick Reference

### Hooks
```typescript
// Data fetching
const { data, isLoading, error } = useRuns(apiClient);
const { data } = useReportsByRun(apiClient, runId);

// Mutations
const mutation = useExecuteRun(apiClient);
const mutation = useImportHireData(apiClient);

// UI State
const { alert, showAlert } = useAlert(3000);
const { dragActive, handleDrag } = useDragAndDrop();
```

### Context
```typescript
import { useApiClient } from '../providers';
const apiClient = useApiClient();
```

### Utilities
```typescript
import { extractErrorMessage, isValidCsvFile, downloadFile } from '../utils';
```

---

Happy coding! 🚀
