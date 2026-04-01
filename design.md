# Design: Coverage Threshold 80%

## Technical Approach

Push test coverage from 79.73% to 80% by adding targeted unit tests for uncovered lines in the auth module. Following the proposal and specs, we will add minimal tests focused only on previously untested code paths in auth.routes.js, auth.service.js, and auth.controller.js.

## Architecture Decisions

### Decision: Test File Location

**Choice**: Create new test file `tests/integration/auth-coverage-gap.spec.js`
**Alternatives considered**: 
- Adding tests to existing auth test files
- Creating separate test files for each module
**Rationale**: 
- Following the proposal's explicit instruction to add tests to this specific file
- Keeps coverage gap tests organized and identifiable
- Maintains separation from existing feature-specific tests
- Aligns with existing integration test structure

### Decision: Test Implementation Approach

**Choice**: Use Vitest with jsdom for DOM-dependent tests, mocking HTTP requests
**Alternatives considered**:
- Using real HTTP requests (would require test backend)
- Testing only pure functions (would miss DOM interactions)
**Rationale**:
- Project already uses Vitest + jsdom for integration tests
- auth.routes.js requires DOM manipulation (querySelector)
- auth.service.js functions make HTTP calls that need mocking
- Provides realistic testing environment without external dependencies

## Data Flow

For auth.routes.js testing:
    Test Runner ──→ jsdom Environment ──→ auth.routes.js 
                         │                   │
                         │                   ├─→ querySelector(".app__content") 
                         │                   │
                         │                   └─→ initAuth() call
                         │
                         └─→ Verify window.appFeatureRoutes.push() calls

For auth.service.js testing:
    Test Runner ──→ Mock httpClient ──→ auth.service.js functions
                         │                     │
                         │                     ├─→ login() POST /api/v1/auth/login
                         │                     │
                         │                     └─→ verificarMfa() POST /api/v1/auth/verify-mfa
                         │
                         └─→ Validate request bodies and return values

For auth.controller.js testing:
    Test Runner ──→ jsdom Environment ──→ auth.controller.js
                         │                   │
                         │                   ├─→ initAuth(container) 
                         │                   │     │
                         │                   │     ├─→ Sets domContainer
                         │                   │     ├─→ Resets authState
                         │                   │     └─→ Calls renderAuthScreen()
                         │                   │
                         └─→ Verify state initialization and DOM interaction

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `tests/integration/auth-coverage-gap.spec.js` | Create | New test file targeting uncovered lines in auth module |
| *(No production files modified)* | None | Design specifies test-only changes per requirements |

## Interfaces / Contracts

No new interfaces or contracts needed as we are only adding tests.

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Integration | auth.routes.js route registration | jsdom environment, verify window.appFeatureRoutes modifications |
| Integration | auth.service.js login() and verificarMfa() functions | Mock httpClient, validate request parameters and return values |
| Integration | auth.controller.js initAuth() entry point | jsdom environment, verify state initialization and DOM setup |

## Migration / Rollout

No migration required. This change only adds test files.

## Open Questions

- [ ] Should we mock the entire httpClient module or just specific endpoints?
- [ ] What is the best way to verify the exact arguments passed to mocked functions?
- [ ] Should we test error handling paths in addition to success paths?

## Next Step
Ready for tasks (sdd-tasks).