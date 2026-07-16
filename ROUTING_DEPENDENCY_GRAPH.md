# TROVA ROUTING DEPENDENCY GRAPH
## Custom Router → React Router Migration Analysis

---

## 1. ROUTING PRIMITIVES (Owned Exclusively by App.tsx)

| Primitive | Type | Lines in App.tsx | Used By |
|---|---|---|---|
| `currentRoute` | `useState` | 136 | App.tsx only |
| `setCurrentRoute` | setter | 136 | App.tsx only |
| `navigate(path)` | function | 497 | App.tsx only (passed as callbacks to children) |
| `handleURLRouting()` | function | 427 | App.tsx only |
| `getDashboardTabPath(tab)` | function | 372 | App.tsx only |
| `getDashboardPathTab(path)` | function | 398 | App.tsx only |
| `currentPath` | `const` | 512 | App.tsx only |
| `activeDashboardTab` | derived state | 513 | App.tsx only |
| `urlParamsTransactionId` | `useState` | 168 | App.tsx only |
| `isUnknownRoute(path)` | function | 109 | App.tsx only |
| `routeVersion` | `useState` | 165 | App.tsx only |
| `popstate` listener | effect | 504 | App.tsx only |

**Key finding:** No child component directly imports or calls any routing primitive. All navigation flows through callback props.

---

## 2. CALLBACK PROP DEPENDENCY GRAPH

### 2.1 App.tsx → Child Components

```
App.tsx
├── navigate() (custom router)
│   ├── → NotFoundPage.onGoHome
│   ├── → LandingPage.onNavigate (dest string)
│   ├── → AuthPage.onNavigate
│   ├── → OnboardingFlow.onComplete
│   ├── → BuyerCheckoutPublic.onNavigateToLanding
│   ├── → BuyerCheckoutPublic.onNavigateToTracking
│   ├── → BuyerTrackingPublic.onNavigateToLanding
│   ├── → LegalPagePublic.onNavigateToLanding (×2)
│   ├── → AdminDashboard.onNavigateToLanding
│   ├── → StorefrontPublic.onNavigateToLanding
│   ├── → StaffLogin.onNavigate
│   ├── → Sidebar.onNavigateTab
│   ├── → Sidebar.onExitToLanding
│   ├── → TopNavbar.onNavigateTab
│   ├── → TopNavbar.onLogout (includes navigate('/'))
│   ├── → VendorDashboard.onSelectBuyerCheckout (includes navigate('/dashboard/console'))
│   ├── → VendorDashboard.onNavigateTab
│   ├── → BuyerTerminal.onNavigateToDashboard
│   ├── → DashboardPage.onNavigateTab
│   └── → StorefrontProfile.onNavigateToTab
│
├── getDashboardTabPath(tab)
│   ├── → Sidebar.onNavigateTab wrapper
│   └── → TopNavbar.onNavigateTab wrapper
│
└── currentRoute (state machine)
    ├── → NotFoundPage rendering
    ├── → LandingPage rendering
    ├── → AuthPage rendering + initialMode prop
    ├── → OnboardingFlow rendering
    ├── → BuyerCheckoutPublic rendering
    ├── → BuyerTrackingPublic rendering
    ├── → LegalPagePublic rendering (×2)
    ├── → AdminDashboard rendering + ProtectedRoute guard
    ├── → StorefrontPublic rendering
    ├── → StaffLogin rendering (post-render override)
    ├── → isLightThemeActive derivation
    ├── → Authenticated portal workspace guard
    ├── → WelcomeOverlay rendering
    ├── → BuyerTerminal rendering (combined with currentPath)
    ├── → VendorDashboard rendering (combined with activeDashboardTab)
    ├── → StorefrontProfile rendering (combined with activeDashboardTab)
    ├── → Escrow links tab rendering
    ├── → AnalyticsView rendering
    ├── → DisputesView rendering
    ├── → NotificationsView rendering
    ├── → ReferralsView rendering
    ├── → PayoutView rendering
    ├── → SettingsView rendering
    ├── → AppCenter rendering
    └── → HelpCenter rendering
```

---

## 3. CHILD COMPONENT PROP CONTRACTS

### 3.1 Components That Receive Navigation Callbacks

| Component | Callback Props | Current Implementation | Migration Impact |
|---|---|---|---|
| `NotFoundPage` | `onGoHome?: () => void` | `() => navigate('/')` | Replace with internal `useNavigate()` |
| `LandingPage` | `onNavigate: (dest: any) => void` | Maps dest strings to `navigate()` | Replace with internal `useNavigate()` |
| `AuthPage` | `onLoginSuccess`, `onNavigate` | `onNavigate` used for tab switching | Replace with internal `useNavigate()` |
| `OnboardingFlow` | `onComplete: () => void` | `() => navigate('/dashboard')` | Replace with internal `useNavigate()` |
| `BuyerCheckoutPublic` | `onNavigateToLanding`, `onNavigateToTracking` | Direct navigation callbacks | Replace with internal `useNavigate()` + `useParams()` |
| `BuyerTrackingPublic` | `onNavigateToLanding` | Direct navigation callback | Replace with internal `useNavigate()` |
| `LegalPagePublic` | `onNavigateToLanding` | Direct navigation callback | Replace with internal `useNavigate()` |
| `AdminDashboard` | `onNavigateToLanding` | `() => navigate('/dashboard')` | Replace with internal `useNavigate()` |
| `StorefrontPublic` | `onNavigateToLanding` | Direct navigation callback | Replace with internal `useNavigate()` |
| `StaffLogin` | `onNavigate` | Direct navigation callback | Replace with internal `useNavigate()` |
| `Sidebar` | `onNavigateTab`, `onExitToLanding` | `onNavigateTab` maps tabs to paths | Replace with internal `useNavigate()` or derive from URL |
| `TopNavbar` | `onNavigateTab`, `onMobileMenuToggle`, `onLogout`, `onThemeToggle`, `onVerifyNowClick` | `onNavigateTab` maps tabs to paths | Replace with internal `useNavigate()` or derive from URL |
| `VendorDashboard` | `onNavigateTab`, `onSelectBuyerCheckout` | `onNavigateTab` for tab switching | Replace with internal `useNavigate()` |
| `BuyerTerminal` | `onLinkSelect`, `onUpdateStatus`, `onNavigateToDashboard` | `onNavigateToDashboard` for back nav | Replace with internal `useNavigate()` |
| `DashboardPage` | `onNavigateTab` | Tab switching callback | Replace with internal `useNavigate()` |
| `StorefrontProfile` | `onNavigateToTab` | Tab switching callback | Replace with internal `useNavigate()` or keep local state |
| `WorkdayActionHub` | `onNavigateTab` | Dispute navigation callback | Replace with internal `useNavigate()` |
| `OnboardingChecklist` | `onNavigateTab` | Settings/storefront navigation | Replace with internal `useNavigate()` |

### 3.2 Components That Do NOT Receive Navigation Callbacks (No Changes Needed)

| Component | Reason |
|---|---|
| `PayoutView` | Receives `onTriggerPayout` (business logic, not navigation) |
| `SettingsView` | Receives `onProfileUpdate`, `onDeleteAccount`, `onTriggerKYC` (business logic) |
| `AnalyticsView` | Receives `escrowLinks` only |
| `DisputesView` | Receives `escrowLinks`, `onUpdateStatus`, `focusedDisputeId` (business logic) |
| `NotificationsView` | Receives `profileId` only |
| `ReferralsView` | Receives `sellerId`, `referralsData`, `onReferralsUpdate` (business logic) |
| `AppCenter` | No navigation props |
| `HelpCenter` | No navigation props |
| `CreateLinkModal` | Receives `onClose`, `onCreate`, `theme` (modal logic) |
| `GlobalKYCModal` | Receives `onClose`, `onVerified`, `triggerReason` (modal logic) |
| `WelcomeOverlay` | Receives `sellerName` only |
| `PWASplashScreen` | No props |
| `PWAPromptManager` | No props |
| `ProtectedRoute` | Receives `requiredRole` (auth guard) |
| `AdminSidebar` | Internal state, no navigation callbacks from App.tsx |

---

## 4. DATA FLOW FOR URL PARAMETERS

### 4.1 Current Flow

```
window.location.pathname
    ↓
App.tsx: urlParamsTransactionId (useState)
    ↓
Props: transactionId={urlParamsTransactionId}
    ↓
├── BuyerCheckoutPublic (receives as `transactionId`)
├── BuyerTrackingPublic (receives as `transactionId`)
└── StorefrontPublic (receives as `handle`)
```

### 4.2 React Router Flow

```
useParams<'id'>() in /pay/:id route
useParams<'id'>() in /track/:id route
useParams<'handle'>() in /store/:handle route
```

---

## 5. AUTH GUARD DEPENDENCY

### 5.1 Current Flow

```
App.tsx initializeProfile
    ↓
auth.isAuthenticated, auth.profileLoading, auth.profile, auth.userRole
    ↓
useEffect checks currentPath against auth state
    ↓
setCurrentRoute('landing') + replaceState('/') if not authenticated
    ↓
currentRoute === 'app' && !auth.isAuthenticated → show loader
```

### 5.2 React Router Flow

```
<ProtectedRoute> wrapper
    ↓
useNavigate(), Navigate, location
    ↓
Redirect to /signin if not authenticated
```

---

## 6. ACTIVE TAB / DASHBOARD SUB-ROUTING

### 6.1 Current Flow

```
location.pathname
    ↓
currentPath = window.location.pathname
    ↓
activeDashboardTab = getDashboardPathTab(currentPath) || activeTab
    ↓
activeDashboardTab state drives which tab component renders
    ↓
getDashboardTabPath(activeTab) generates navigation paths
```

### 6.2 React Router Flow

```
<Routes>
  <Route path="/dashboard" element={<SellerLayout />}>
    <Route index element={<VendorDashboard />} />
    <Route path="analytics" element={<AnalyticsView />} />
    <Route path="disputes" element={<DisputesView />} />
    ...
  </Route>
</Routes>
```

---

## 7. COMPLETE FILE DEPENDENCY LIST

### Files that MUST change for C3-2:

| File | Dependency Type | What Changes |
|---|---|---|
| `frontend/src/App.tsx` | **PRIMARY** | Remove routing primitives, add `<Routes>`, replace callbacks with `useNavigate()` |
| `frontend/src/components/Sidebar.tsx` | Consumer | Replace `onNavigateTab` with internal navigation |
| `frontend/src/components/TopNavbar.tsx` | Consumer | Replace `onNavigateTab`, `onLogout` with internal navigation |
| `frontend/src/components/LandingPage.tsx` | Consumer | Replace `onNavigate` prop |
| `frontend/src/components/auth/AuthPage.tsx` | Consumer | Replace `onNavigate` prop |
| `frontend/src/components/OnboardingFlow.tsx` | Consumer | Replace `onComplete` prop |
| `frontend/src/components/NotFoundPage.tsx` | Consumer | Replace `onGoHome` prop |
| `frontend/src/components/BuyerCheckoutPublic.tsx` | Consumer | Replace `onNavigateToLanding`, `onNavigateToTracking`; add `useParams()` |
| `frontend/src/components/BuyerTrackingPublic.tsx` | Consumer | Replace `onNavigateToLanding`; add `useParams()` |
| `frontend/src/components/StorefrontPublic.tsx` | Consumer | Replace `onNavigateToLanding`; add `useParams()` |
| `frontend/src/components/BuyerTerminal.tsx` | Consumer | Replace `onNavigateToDashboard` |
| `frontend/src/components/LegalPagePublic.tsx` | Consumer | Replace `onNavigateToLanding` |
| `frontend/src/components/StaffLogin.tsx` | Consumer | Replace `onNavigate` prop |
| `frontend/src/components/AdminDashboard.tsx` | Consumer | Replace `onNavigateToLanding` |
| `frontend/src/components/dashboard/DashboardPage.tsx` | Consumer | Replace `onNavigateTab`, `onSelectBuyerCheckout` |
| `frontend/src/components/StorefrontProfile.tsx` | Consumer | Replace `onNavigateToTab` |
| `frontend/src/components/dashboard/WorkdayActionHub.tsx` | Consumer | Replace `onNavigateTab` |
| `frontend/src/components/dashboard/OnboardingChecklist.tsx` | Consumer | Replace `onNavigateTab` |
| `frontend/src/components/ProtectedRoute.tsx` | Guard | Rewrite using `useNavigate` + `<Navigate>` |

### Files that do NOT need changes for C3-2:

| File | Reason |
|---|---|
| `frontend/src/providers/AuthProvider.tsx` | Auth state only, no routing |
| `frontend/src/providers/ThemeProvider.tsx` | Theme only |
| `frontend/src/components/ToastContext.tsx` | Toast only |
| `frontend/src/hooks/useEscrowLinks.ts` | Escrow domain only |
| `frontend/src/hooks/usePayouts.ts` | Payout domain only |
| `frontend/src/hooks/useReferrals.ts` | Referral domain only |
| `frontend/src/hooks/useModals.ts` | Modal state only |
| `frontend/src/lib/kycLimits.ts` | Business logic only |
| `frontend/src/lib/services/*.ts` | Data fetching only |
| `frontend/src/data/localStorage.ts` | Storage only |
| `frontend/src/components/PayoutView.tsx` | Business logic, no navigation callbacks |
| `frontend/src/components/SettingsView.tsx` | Business logic, no navigation callbacks |
| `frontend/src/components/AnalyticsView.tsx` | Data display only |
| `frontend/src/components/DisputesView.tsx` | Business logic, no navigation callbacks |
| `frontend/src/components/NotificationsView.tsx` | Data display only |
| `frontend/src/components/ReferralsView.tsx` | Business logic, no navigation callbacks |
| `frontend/src/components/AppCenter.tsx` | No navigation props |
| `frontend/src/components/HelpCenter.tsx` | No navigation props |
| `frontend/src/components/PWASplashScreen.tsx` | No props |
| `frontend/src/components/PWAPromptManager.tsx` | No props |
| `frontend/src/components/VerifiedBadge.tsx` | No navigation |
| `frontend/src/components/TransactionFeeCalculator.tsx` | No navigation |
| `frontend/src/components/TiltCard.tsx` | No navigation |
| `frontend/src/components/SupportChatWidget.tsx` | No navigation |
| `frontend/src/components/SlideToVerify.tsx` | No navigation |
| `frontend/src/components/BrandLogo.tsx` | No navigation |

---

## 8. CRITICAL PATH FOR C3-2

```
App.tsx (currentRoute, navigate, handleURLRouting)
    ↓
18 child components receive callback props
    ↓
Each child component must be updated to use internal useNavigate()
    ↓
OR App.tsx keeps callbacks but simplifies them (path strings instead of navigate())
```

**Minimum viable C3-2 scope:**
1. Replace `currentRoute` dispatch with `<Routes>` in App.tsx
2. Replace `navigate()` with `useNavigate()` in App.tsx
3. Update all 18 child components to use `useNavigate()` internally
4. Remove `currentRoute`, `handleURLRouting`, `getDashboardTabPath`, `getDashboardPathTab`, `currentPath`, `activeDashboardTab`, `urlParamsTransactionId`, `isUnknownRoute`, `routeVersion`, `popstate` listener

**Estimated touch count:** 20 files (1 primary + 18 consumers + 1 guard)

---

## 9. RISK ASSESSMENT

| Risk | Severity | Mitigation |
|---|---|---|
| Navigation callback props deeply nested | HIGH | Update components in dependency order (leaf → parent) |
| Auth guard regression | HIGH | Test login/logout/refresh after each component update |
| Dashboard tab state loss | MEDIUM | Derive `activeTab` from `location.pathname` with fallback |
| Staff login bypass | LOW | Ensure `/staff/login` stays outside `<ProtectedRoute>` |
| URL param extraction breakage | MEDIUM | Use `useParams()` in route components, pass as props |
| Back button regression | LOW | `<BrowserRouter>` handles `popstate` automatically |
| Refresh on deep links | LOW | React Router handles this natively |
| PWA service worker | NONE | SW registration is outside router |

---

## 10. MIGRATION SEQUENCING

### Step 1: Prepare Child Components (No App.tsx changes)
- Update `Sidebar.tsx` to accept `useNavigate()` or path strings
- Update `TopNavbar.tsx` similarly
- Update `NotFoundPage.tsx` to use `useNavigate()`
- Update `LandingPage.tsx` to use `useNavigate()`
- Update all public page components (`BuyerCheckoutPublic`, `BuyerTrackingPublic`, `StorefrontPublic`, `LegalPagePublic`, `StaffLogin`, `AdminDashboard`) to use `useNavigate()`

### Step 2: Rewrite ProtectedRoute
- Convert `ProtectedRoute.tsx` to use `useNavigate()` + `<Navigate>`

### Step 3: Migrate App.tsx Dispatch
- Replace `currentRoute` state with `<Routes>`
- Replace `navigate()` with `useNavigate()`
- Remove all routing helper functions

### Step 4: Cleanup
- Remove dead code from App.tsx
- Verify all navigation paths work

---

*Generated: 2026-07-08*
*Based on codebase state after C1-4 and C3-1 completion*
