# AI Agent Development Guidelines

## Project Overview

This is a **Tauri + React + TypeScript** desktop application that imports OBX files (Lexware format) and creates quotations in the Lexware API.
The application is built for macOS using Bun as the runtime and package manager.

## Technical Stack

### Core Technologies

- **Framework**: Tauri v2 (Rust backend, web frontend)
- **Frontend**: React 19 + TypeScript 5.9
- **Bundler**: Vite 7 with React plugin
- **Runtime**: Bun (for development and dependency management)
- **Styling**: Tailwind CSS v4 + Headless UI components
- **State Management**: React useState/useEffect hooks (no external state library)

### Development Tools

- **Linting & Formatting**: Biome (all-in-one toolchain for linting and formatting)
- **Testing**: Bun test with @xmldom/xmldom for XML parsing tests
- **Package Manager**: Bun (uses bun.lockb)

## Code Style & Conventions

### File Organization

```
src/
├── components/          # React components organized by feature
│   ├── form/           # Form-related components
│   └── lineitems/      # Line item display components
├── *.ts                # Core logic modules (api, obx, types, util)
└── *.tsx               # React components (App, main)
```

### TypeScript Configuration

- **Target**: ES2020 with DOM libraries
- **Module**: ESNext with bundler resolution
- **Strict Mode**: Enabled with all strict checking options
- **JSX**: react-jsx (new JSX transform)
- **Import Extensions**: .ts/.tsx extensions allowed in imports

### Naming Conventions

- **Files**: camelCase for TypeScript files, PascalCase for React components
- **Components**: PascalCase function components (exported as named exports)
- **Types/Interfaces**: PascalCase with descriptive names
- **Variables**: camelCase with descriptive names
- **Constants**: camelCase (not SCREAMING_SNAKE_CASE)

### Code Patterns

#### React Components

```tsx
// Preferred pattern: Named function exports with Props interface
export function ComponentName({ prop1, prop2 }: Props) {
  // Component logic
}

interface Props {
  prop1: string;
  prop2: (value: string) => void;
}
```

#### Type Definitions

- Use `interface` for object shapes, especially props
- Use `type` for unions, mapped types, and complex type operations
- Define API response types matching external API schemas
- Use type guards for runtime type checking (`item is TypeName`)

#### API Calls

- Use Tauri's `@tauri-apps/plugin-http` for HTTP requests
- Handle errors with try/catch or `.catch()` Promise chains
- Return specific typed responses
- Include proper error messages with status codes

#### Event Handling

- Use arrow functions in JSX event handlers: `onClick={() => action()}`
- For form submissions: `(e: FormEvent<HTMLFormElement>) => { e.preventDefault(); }`
- Use `void` prefix for async operations that don't need awaiting: `void handleAsync()`

### Testing Approach

- Unit tests using Bun's built-in test runner
- Focus on core logic functions (XML parsing, data transformation)
- Use real example files for integration testing
- Mock external APIs when needed
- Test file naming: `*.spec.ts`

### Performance Considerations

- Use `React.StrictMode` in development
- Minimize re-renders with proper dependency arrays
- Use type guards instead of runtime type checking libraries

### UI/UX Patterns

- **Components**: Headless UI for accessible components (Dialog, Disclosure, etc.)
- **Styling**: Utility-first Tailwind classes, avoid custom CSS
- **Interactions**: Hover states, transitions, focus management

### File System Integration

- Use Tauri plugins for file system access (`@tauri-apps/plugin-fs`)
- Support drag & drop with Tauri's drag drop events
- Handle both file picker and drag & drop interfaces
- Parse XML using DOMParser (native web API)

### Error Handling

- Display user-friendly error messages in German (UI language)
- Include technical details in development/debugging modes
- Use error boundaries for React error handling
- Log errors to console for debugging

### Dependencies Philosophy

- Prefer native web APIs over external libraries when possible
- Use well-maintained, popular libraries for complex functionality
- Keep bundle size minimal - avoid heavy dependencies
- Regular updates to stay current with ecosystem

## Development Workflow

1. Use `bun tauri dev` for development server
2. To bundle the macOS app use `bun build:macos`
3. `bun lint` and `bun format` for code quality
4. Test with `bun test` before committing
