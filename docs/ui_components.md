# UI Components (`src/ui`)

Moth uses [React Ink](https://github.com/vadimdemedes/ink) to render a Terminal User Interface (TUI).

## Main Application (`src/ui/App.tsx`)

The `App` component acts as the main view controller.

### Features
-   **Chat Interface**: Renders a scrollable list of messages using `flexDirection="column"`.
-   **Input Handling**: Captures user keystrokes for chat and control signals (Pause/Resume).
-   **Permission Queue**: Intercepts tool execution requests and displays a "Permission Required" overlay.

```tsx
// Structure of the App component
<Box flexDirection="column">
    <Header />
    <MessageList messages={messages} />
    {pendingPermission && <PermissionOverlay request={pendingPermission} />}
    <InputArea isProcessing={isProcessing} />
</Box>
```

## Wizards

Wizards are self-contained interactive components used for configuration.

### LLM Add Wizard (`src/ui/wizards/LLMWizard.tsx`)
Implements the **Model-First** setup flow.
1.  **Family Selection**: Selects model family (LLaMA, GPT, etc.).
2.  **Deployment Selection**: Local vs Cloud.
3.  **Credential Entry**: Conditional rendering of input fields.
4.  **Confirmation**: Final summary view.

### LLM Remove Wizard (`src/ui/wizards/LLMRemover.tsx`)
-   Displays a list of profiles.
-   Uses styled selection (Green for active, Red for deletion target).
-   Requires explicit 'y' confirmation to prevent accidents.

## Utilities

### WordMoth (`src/ui/components/WordMoth.tsx`)
-   Renders the "MOTH" ascii art header.
-   Supports gradient coloring (Blue/Cyan theme).
