# Architecture Documentation

## SOLID Principles Implementation

This document outlines how SOLID principles are applied throughout the application.

### 1. Single Responsibility Principle (SRP)

Each module has a single, well-defined responsibility:

- **API Layer** (`services/`): Handles HTTP communication only
  - `interfaces/IApiClient.ts` - Defines API contract
  - `implementations/AxiosApiClient.ts` - Implements HTTP client

- **Hooks** (`hooks/`): Each hook manages one piece of state
  - `useRuns.ts` - Manages run queries
  - `useReports.ts` - Manages report queries
  - `useMutations.ts` - Manages API mutations
  - `useAlert.ts` - Manages alert state
  - `useDragAndDrop.ts` - Manages drag/drop state

- **Components**:
  - **Presentational** (`components/presentational/`): Pure UI components, no business logic
    - `FileUploadDropZone.tsx` - Only renders drop zone UI
    - `RunExecutorForm.tsx` - Only renders form UI
  
  - **Container** (`components/`): Business logic orchestration
    - `FileUpload.tsx` - Handles file upload logic
    - `RunExecutor.tsx` - Handles run execution logic

- **Utilities** (`utils/`): Single-purpose helper functions
  - `fileUtils.ts` - File operations only
  - `errorUtils.ts` - Error transformation only
  - `dateUtils.ts` - Date formatting only

### 2. Open/Closed Principle (OCP)

The application is open for extension, closed for modification:

- **Route-based Extensibility**: New pages can be added without modifying `App.tsx`
  ```typescript
  // Easy to add new routes
  const NAV_LINKS: NavLink[] = [
    { path: '/', label: 'Dashboard', icon: <Settings /> },
    { path: '/reports', label: 'Reports', icon: <FileText /> },
    // Add new routes here
  ];
  ```

- **Component Composition**: Presentational components are reusable via props
  ```typescript
  // RunExecutorForm can be reused in different contexts
  <RunExecutorForm
    onExecute={handler}
    modes={modes}
    {...otherProps}
  />
  ```

- **Hook Composition**: Hooks can be combined without modification
  ```typescript
  // Combine multiple hooks without changing them
  const modes = useModes(apiClient);
  const mutation = useExecuteRun(apiClient);
  ```

### 3. Liskov Substitution Principle (LSP)

Derived types are safely substitutable for their base types:

- **IApiClient Interface**: Any implementation of `IApiClient` can replace another
  ```typescript
  // Can swap AxiosApiClient for MockApiClient in tests
  const apiClient = new MockApiClient(); // or AxiosApiClient
  // Both implement IApiClient, both work identically
  ```

- **Component Props**: Props interfaces are properly typed and substitutable
  ```typescript
  // All components expecting FileUploadProps interface work the same way
  function ComponentA(props: FileUploadProps) { ... }
  function ComponentB(props: FileUploadProps) { ... }
  ```

### 4. Interface Segregation Principle (ISP)

Clients depend only on interfaces they use:

- **Hooks Exports**: Export only necessary hooks, not all hooks
  ```typescript
  // api.ts only exports what it needs
  export { useRuns } from './useRuns';
  export { useAlert } from './useAlert';
  // Not forced to import everything
  ```

- **Component Props**: Split large prop objects into focused interfaces
  ```typescript
  interface FileUploadDropZoneProps {
    isLoading: boolean;
    onDragEnter: (e: React.DragEvent) => void;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  }
  // Not forced to accept props that aren't used
  ```

- **API Interface**: Segregated into logical method groups
  ```typescript
  interface IApiClient {
    // Runs
    getRuns(): Promise<ComplianceRun[]>;
    executeRun(): Promise<ComplianceRun>;
    
    // Reports
    getReportsByRun(): Promise<ComplianceReport[]>;
    
    // Clean separation of concerns
  }
  ```

### 5. Dependency Inversion Principle (DIP)

High-level modules depend on abstractions, not low-level modules:

- **API Client Dependency**: Components depend on `IApiClient` interface, not concrete implementation
  ```typescript
  // FileUpload depends on IApiClient abstraction
  export function FileUpload({ onSuccess, onError }: FileUploadProps) {
      const apiClient = useApiClient(); // Interface, not concrete class
      const mutation = useImportHireData(apiClient);
  }
  ```

- **Context Provider**: Enables dependency injection
  ```typescript
  // ApiProvider allows injecting different implementations
  <ApiProvider apiClient={mockClient}>
    <App />
  </ApiProvider>
  ```

- **Factory Pattern**: Creates instances via factory, not direct instantiation
  ```typescript
  // Factory provides abstraction layer
  export function createApiClient(baseURL?: string): IApiClient {
      return new AxiosApiClient(baseURL);
  }
  ```

## Directory Structure

```
src/
├── services/
│   ├── interfaces/          # Abstractions (SRP, DIP)
│   │   └── IApiClient.ts    # API contract
│   ├── implementations/      # Concrete implementations (SRP)
│   │   └── AxiosApiClient.ts
│   └── api.ts               # Factory and singleton
├── providers/               # Dependency injection (DIP)
│   ├── ApiProvider.tsx      # Context provider
│   ├── useApiClient.ts      # Context hook
│   └── index.ts
├── hooks/                   # State management (SRP)
│   ├── useRuns.ts
│   ├── useReports.ts
│   ├── useMutations.ts
│   ├── useAlert.ts
│   ├── useDragAndDrop.ts
│   ├── useAsync.ts
│   ├── usePrevious.ts
│   ├── useLocalStorage.ts
│   └── index.ts
├── components/
│   ├── presentational/      # Pure UI components (SRP)
│   │   ├── FileUploadDropZone.tsx
│   │   ├── FormField.tsx
│   │   ├── RunExecutorForm.tsx
│   │   └── index.ts
│   ├── layout/              # Layout components (SRP, OCP)
│   │   ├── Navigation.tsx
│   │   ├── Footer.tsx
│   │   └── index.ts
│   ├── FileUpload.tsx       # Container component
│   ├── RunExecutor.tsx      # Container component
│   └── ...
├── pages/                   # Page components
│   ├── Dashboard.tsx
│   └── Reports.tsx
├── utils/                   # Utility functions (SRP)
│   ├── fileUtils.ts
│   ├── errorUtils.ts
│   ├── dateUtils.ts
│   └── index.ts
├── types/
│   └── index.ts            # Shared type definitions
├── App.tsx                 # Main app component (OCP)
└── main.tsx                # Entry point with providers (DIP)
```

## Design Patterns Used

### 1. Dependency Injection
- Implemented via React Context (`ApiProvider`)
- Allows easy testing and configuration

### 2. Factory Pattern
- `createApiClient()` factory function
- Decouples client creation from usage

### 3. Container/Presentational Component Pattern
- Container components: `FileUpload`, `RunExecutor` (business logic)
- Presentational components: `FileUploadDropZone`, `RunExecutorForm` (UI only)

### 4. Custom Hooks Pattern
- Encapsulate reusable state and logic
- Enable composition and testability

### 5. Context Pattern
- Global state management without prop drilling
- Enables dependency injection

## Benefits

1. **Testability**: Easy to mock dependencies via `ApiProvider`
2. **Maintainability**: Clear separation of concerns
3. **Reusability**: Components and hooks are highly reusable
4. **Scalability**: Easy to add new features without modifying existing code
5. **Flexibility**: Easy to swap implementations (e.g., Axios → Fetch)
6. **Type Safety**: Full TypeScript support with interfaces

## Examples

### Adding a New API Endpoint
1. Add method to `IApiClient` interface
2. Implement in `AxiosApiClient`
3. Create hook in `hooks/`
4. Use in component via hook

### Adding a New Page
1. Create page component in `pages/`
2. Add route to `NAV_LINKS` in `App.tsx`
3. No other changes needed (OCP)

### Testing a Component
```typescript
// Easy to inject mock API client
const mockApiClient = new MockApiClient();

render(
  <ApiProvider apiClient={mockApiClient}>
    <FileUpload {...props} />
  </ApiProvider>
);
```
