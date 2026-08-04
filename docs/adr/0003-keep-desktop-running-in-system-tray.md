# ADR-0003: Keep the desktop application running in the system tray

- Status: Accepted
- Date: 2026-08-03

## Context

ClpbrdSync must monitor the operating system clipboard and receive synchronization
events even when its main window is not visible.

Treating the main window as the lifetime of the application would stop clipboard
monitoring whenever the user closes the window.

The application also needs a consistent background execution model across Windows
and macOS.

## Decision

Closing the main window will hide it instead of terminating the application.

ClpbrdSync will remain accessible through a system tray icon. The tray will allow
the user to show or hide the main window and explicitly quit the application.

The application will enforce a single running instance. Attempts to launch another
instance will show and focus the existing main window.

## Consequences

### Positive

- Clipboard synchronization can continue without a visible window.
- The desktop interface and background runtime have independent lifecycles.
- Windows and macOS provide consistent behavior.
- Multiple clipboard monitors and synchronization connections are prevented.

### Negative

- Users may expect the application to terminate when closing its window.
- The tray icon and onboarding must clearly communicate background execution.
- Application shutdown requires explicit lifecycle and resource cleanup.
- macOS and Windows tray behavior require platform-specific testing.