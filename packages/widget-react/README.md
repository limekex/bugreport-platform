# @limekex/bugreport-widget-react

React wrapper for the BugReport Widget SDK. Provides a declarative `<BugReporter>` component with React hooks and SSR support.

## Installation

```bash
npm install @limekex/bugreport-widget-react
# or
pnpm add @limekex/bugreport-widget-react
# or
yarn add @limekex/bugreport-widget-react
```

## Usage

### Basic Example

```tsx
import { BugReporter } from '@limekex/bugreport-widget-react';

function App() {
  return (
    <>
      <h1>My App</h1>
      
      <BugReporter
        apiBaseUrl="https://gitreport.betait.no"
        environment="production"
        appVersion="1.2.3"
        commitSha="abc123def"
      />
    </>
  );
}
```

### With Current User

```tsx
<BugReporter
  apiBaseUrl="https://gitreport.betait.no"
  environment="staging"
  currentUser={{
    id: 'user-123',
    email: 'john@example.com',
    name: 'John Doe',
    role: 'admin'
  }}
/>
```

### With Theme Customization

```tsx
<BugReporter
  apiBaseUrl="https://gitreport.betait.no"
  environment="production"
  theme={{
    primaryColor: '#3b82f6',
    buttonPosition: 'bottom-left',
    zIndex: 9999
  }}
/>
```

### Disabled in Development

```tsx
<BugReporter
  apiBaseUrl="https://gitreport.betait.no"
  environment={process.env.NODE_ENV}
  enabled={process.env.NODE_ENV !== 'development'}
/>
```

## Props

All props from the vanilla SDK are supported:

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `apiBaseUrl` | `string` | ✅ | Base URL of your bugreport-api service |
| `environment` | `string` | ✅ | Environment name (e.g., "production", "staging") |
| `enabled` | `boolean` | ❌ | Whether the widget is active (default: `true`) |
| `appVersion` | `string` | ❌ | Your app version string |
| `commitSha` | `string` | ❌ | Git commit SHA of the running build |
| `buildNumber` | `string` | ❌ | CI build number |
| `currentUser` | `object` | ❌ | Currently authenticated user |
| `getTraceContext` | `function` | ❌ | Function returning trace context (OpenTelemetry, Sentry) |
| `theme` | `object` | ❌ | Theme customization options |

## SSR Support

This component is **SSR-safe** and will only initialize on the client side. Safe to use with:

- Next.js (App Router & Pages Router)
- Remix
- Gatsby
- Any React SSR framework

No special configuration needed!

## TypeScript

Full TypeScript support with type definitions included.

```tsx
import { BugReporter, type BugReporterConfig } from '@limekex/bugreport-widget-react';

const config: BugReporterConfig = {
  apiBaseUrl: 'https://gitreport.betait.no',
  environment: 'production',
  appVersion: '1.0.0'
};

<BugReporter {...config} />
```

## How It Works

The component:
1. Checks if running in a browser (`typeof window !== 'undefined'`)
2. Initializes the vanilla SDK on mount
3. Destroys the widget on unmount
4. Re-initializes if props change

## License

MIT
