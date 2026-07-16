# TROVA ROUTING MIGRATION MATRIX
## Custom Router → React Router v6+

---

## 1. ROUTE STATE MACHINE MAPPING

| Current `currentRoute` Value | Current Path(s) | React Router Path | Route Component / Guard |
|---|---|---|---|
| `'landing'` | `/`, ``, `/index.html` | `/` | `<LandingPage />` |
| `'login'` | `/signin`, `/login` | `/signin` | `<AuthPage mode="login" />` |
| `'signup'` | `/signup` | `/signup` | `<AuthPage mode="signup" />` |
| `'onboarding'` | `/onboarding` | `/onboarding` | `<OnboardingFlow />` |
| `'app'` | `/dashboard`, `/dashboard/*` | `/dashboard/*` | `<SellerLayout />` (protected) |
| `'pay'` | `/pay/:id` | `/pay/:id` | `<BuyerCheckoutPublic />` |
| `'track'` | `/track/:id` | `/track/:id` | `<BuyerTrackingPublic />` |
| `'store'` | `/store/:handle` | `/store/:handle` | `<StorefrontPublic />` |
| `'admin'` | `/admin`, `/admin/*` | `/admin/*` | `<AdminLayout />` (admin guard) |
| `'privacy'` | `/legal/privacy` | `/legal/privacy` | `<LegalPagePublic type="privacy" />` |
| `'terms'` | `/legal/terms` | `/legal/terms` | `<LegalPagePublic type="terms" />` |
| `'404'` | unknown | `*` | `<NotFoundPage />` |
| *(staff override)* | `/staff/login` | `/staff/login` | `<StaffLogin />` |

---

## 2. NAVIGATION FUNCTION MAPPING

| Current Pattern | Current Code | React Router Equivalent |
|---|---|---|
| Programmatic navigation | `navigate('/dashboard')` | `const nav = useNavigate(); nav('/dashboard')` |
| Replace state (redirects) | `window.history.replaceState(null, '', '/')` | `const nav = useNavigate(); nav('/', { replace: true })` |
| Back button sync | `window.addEventListener('popstate', handleURLRouting)` | Automatic — `<BrowserRouter>` handles `popstate` |
| Path change detection | `handleURLRouting()` called after `pushState` | Automatic — `useLocation()` updates on navigation |
| URL param extraction | `path.split('/pay/')[1]` | `const { id } = useParams();` |
| Multiple param types | `urlParamsTransactionId` state | `const { id, handle, transactionId } = useParams();` per route |
| Current path | `window.location.pathname` | `const location = useLocation(); location.pathname` |
| Pathname check | `window.location.pathname === '/staff/login'` | `<Route path="/staff/login" element={...}>` |
| Query/hash | `window.location.hash` | `const { hash } = useLocation();` |

---

## 3. STATE MIGRATION MATRIX

| Current State | Location | React Router Replacement | Notes |
|---|---|---|---|
| `currentRoute` | `useState` in App.tsx | **DELETE** — use `<Routes>` + `<Route>` | Route state replaced by router matching |
| `currentPath` | `const currentPath = window.location.pathname` | `const location = useLocation()` | Replace all `currentPath` references |
| `activeDashboardTab` | `useState` + `getDashboardPathTab(currentPath)` | Derive from `location.pathname` or `useParams()` | `/dashboard` → `'dashboard'`, `/dashboard/analytics` → `'analytics'` |
| `urlParamsTransactionId` | `useState` initialized from pathname | `useParams<'id'>()` in `/pay/:id` route | Move into respective route components |
| `routeVersion` | `useState` (incremented on navigate) | **DELETE** — not needed with React Router | Used only to force re-renders; router handles this |
| `activeTab` | `useState<ActiveTab>` | Keep as local state in dashboard layout, or derive from URL | If URL-driven: `/dashboard/analytics` → `activeTab='analytics'` |
| `settingsSubTab` | `useState` + `window.location.hash` | `const { hash } = useLocation()` or keep as local state | Hash-based; can remain local |
| `isLightThemeActive` | `currentRoute === 'app' && theme === 'light'` | `location.pathname.startsWith('/dashboard')` | Derive from `location.pathname` |

---

## 4. ROUTE DISPATCH MAPPING

### 4.1 Top-Level Dispatch

| Current Pattern | Current Code (App.tsx) | React Router Pattern |
|---|---|---|
| 404 check | `if (currentRoute === '404')` | `<Route path="*" element={<NotFoundPage />} />` |
| Landing | `else if (currentRoute === 'landing')` | `<Route index element={<LandingPage />} />` |
| Auth pages | `else if (currentRoute === 'login' || currentRoute === 'signup')` | `<Route path="signin" element={<AuthPage mode="login" />} />`<br>`<Route path="signup" element={<AuthPage mode="signup" />} />` |
| Onboarding | `else if (currentRoute === 'onboarding')` | `<Route path="onboarding" element={<OnboardingFlow />} />` |
| Admin | `else if (currentRoute === 'admin')` | `<Route path="admin/*" element={<AdminLayout />} />` |
| Public pages | `else if (currentRoute === 'pay/track/store/privacy/terms')` | Individual `<Route>` entries |
| Authenticated workspace | `// ELSE RENDER AUTHENTICATED PORTAL WORKSPACE` | `<Route element={<ProtectedRoute />}>` wrapping dashboard routes |

### 4.2 Dashboard Sub-Route Dispatch

| Current Pattern | Current Code | React Router Pattern |
|---|---|---|
| Console | `currentRoute === 'app' && currentPath === '/dashboard/console'` | `<Route path="console" element={<BuyerTerminal />} />` |
| Dashboard home | `activeDashboardTab === 'dashboard' && (currentPath === '/dashboard' || '/dashboard/')` | `<Route index element={<VendorDashboard />} />` |
| Storefront | `activeDashboardTab === 'storefront'` | `<Route path="store" element={<StorefrontProfile />} />` |
| Escrow links | `activeDashboardTab === 'escrow-links'` | `<Route path="links" element={<EscrowLinksView />} />` |
| Analytics | `activeDashboardTab === 'analytics'` | `<Route path="analytics" element={<AnalyticsView />} />` |
| Disputes | `activeDashboardTab === 'disputes'` | `<Route path="disputes" element={<DisputesView />} />` |
| Notifications | `activeDashboardTab === 'notifications'` | `<Route path="notifications" element={<NotificationsView />} />` |
| Referrals | `activeDashboardTab === 'referrals'` | `<Route path="referrals" element={<ReferralsView />} />` |
| Payouts | `activeDashboardTab === 'payouts'` | `<Route path="payouts" element={<PayoutView />} />` |
| Settings | `activeDashboardTab === 'settings'` | `<Route path="settings" element={<SettingsView />} />` |
| Onboarding hub | `activeDashboardTab === 'onboarding-hub'` | `<Route path="onboarding" element={<AppCenter />} />` |
| Help | `activeDashboardTab === 'help'` | `<Route path="help" element={<HelpCenter />} />` |

### 4.3 Staff Login Override

| Current Pattern | Current Code | React Router Pattern |
|---|---|---|
| Post-render override | `if (window.location.pathname === '/staff/login')` | Normal `<Route path="/staff/login" element={<StaffLogin />} />` |
| Bypasses auth | No guard applied | Add separate route outside `<ProtectedRoute>` |

---

## 5. AUTH GUARD MAPPING

| Current Pattern | Current Code | React Router Pattern |
|---|---|---|
| Auth check in init | `if (!session) { setCurrentRoute('landing'); }` | `<Route element={<ProtectedRoute />}>` wrapping protected routes |
| Admin check | `if (currentPath.startsWith('/admin') && role !== 'admin')` | `<Route element={<AdminRoute />}>` or nested `<ProtectedRoute requiredRole="admin">` |
| Authenticated loader guard | `if (!auth.isAuthenticated && currentRoute === 'app')` | `<Navigate to="/signin" replace />` inside `ProtectedRoute` |
| Loading state | `if (auth.profileLoading) return <TrovaLoader />` | Keep in `ProtectedRoute` component |

---

## 6. NAVIGATION CALLBACK MAPPING

| Current Callback Prop | Current Usage | React Router Replacement |
|---|---|---|
| `onNavigate={(dest) => navigate(dest)}` | LandingPage CTAs | `const nav = useNavigate();` inside LandingPage |
| `onNavigateTab={(tab) => navigate(getDashboardTabPath(tab))}` | Sidebar, TopNavbar, VendorDashboard | `const nav = useNavigate(); nav(`/dashboard/${tab}`)` |
| `onNavigateToLanding={() => navigate('/')}` | Public pages, AdminDashboard | `const nav = useNavigate(); nav('/')` |
| `onNavigateToTracking={(id) => navigate(`/track/${id}`)}` | BuyerCheckoutPublic | `const nav = useNavigate(); nav(`/track/${id}`)` |
| `onNavigateToDashboard={() => { navigate('/dashboard'); setActiveTab('dashboard'); }}` | BuyerTerminal | `const nav = useNavigate(); nav('/dashboard')` |
| `onNavigateToTab={(tab) => setActiveTab(tab)}` | StorefrontProfile | Derive from URL or keep local `setActiveTab` |
| `onGoHome={() => navigate('/')}` | NotFoundPage | `const nav = useNavigate(); nav('/')` |
| `onComplete={() => navigate('/dashboard')}` | OnboardingFlow | `const nav = useNavigate(); nav('/dashboard')` |

---

## 7. URL PARAMETER MAPPING

| Current Extraction | Current Code | React Router Equivalent |
|---|---|---|
| Transaction ID from `/pay/:id` | `path.split('/pay/')[1]` | `const { id } = useParams<'id'>();` |
| Tracking ID from `/track/:id` | `path.split('/track/')[1]` | `const { id } = useParams<'id'>();` |
| Store handle from `/store/:handle` | `path.split('/store/')[1]` | `const { handle } = useParams<'handle'>();` |
| Dashboard tab from path | `getDashboardPathTab(currentPath)` | Route structure: `/dashboard/analytics` → `<Route path="analytics" />` |
| Hash for settings | `window.location.hash` | `const { hash } = useLocation();` |

---

## 8. SIDEBAR / NAVBAR STATE MAPPING

| Current Pattern | Current Code | React Router Pattern |
|---|---|---|
| Active tab highlighting | `activeTab` state + `onNavigateTab` callback | Derive from `location.pathname`:<br>`const tab = location.pathname.replace('/dashboard/', '').replace('/dashboard', 'dashboard');` |
| Mobile sidebar open | `isMobileSidebarOpen` state | Keep as local state — UI-only |
| Search term | `linkSearchTerm` state | Keep as local state — UI-only |
| Copy feedback | `copiedId` state | Keep as local state — UI-only |
| Dispute focus | `focusedDisputeId` state | Keep as local state or use URL search params if needed |

---

## 9. BUSINESS LOGIC MAPPING (No Change Required)

| Function | Current Location | React Router Impact |
|---|---|---|
| `handleCreateEscrowLink` | App.tsx | No change — still uses `auth`, `escrowLinks`, `navigate` |
| `handleUpdateStatus` | App.tsx | No change — cross-domain handler stays in App.tsx |
| `handleBatchSettlements` | App.tsx | No change — uses `payouts` + KYC modal |
| `handleCopyShortLink` | App.tsx | No change — UI feedback only |
| `handleNavigateTab` | App.tsx | Simplify — can use `useNavigate()` directly |
| `handleLoginSuccess` | App.tsx | Simplify — uses `navigate()` which becomes `useNavigate()` |
| Security status check | App.tsx useEffect | No change — runs independently of routing |

---

## 10. CHILD COMPONENT PROP CHANGES

| Component | Current Props to Change | New Props / Pattern |
|---|---|---|
| `LandingPage` | `onNavigate={(dest) => navigate(dest)}` | `onNavigate={useNavigate()}` inside component |
| `AuthPage` | `onNavigate={navigate}` | `useNavigate()` inside component |
| `OnboardingFlow` | `onComplete={() => navigate('/dashboard')}` | `useNavigate()` inside component |
| `NotFoundPage` | `onGoHome={() => navigate('/')}` | `useNavigate()` inside component |
| `Sidebar` | `onNavigateTab={(tab) => navigate(getDashboardTabPath(tab))}` | Derive path inside component or keep callback with simplified signature |
| `TopNavbar` | `onNavigateTab`, `onMobileMenuToggle` | Keep callbacks or use context |
| `VendorDashboard` | `onNavigateTab`, `onSelectBuyerCheckout` | Keep callbacks — they call `navigate()` internally |
| `BuyerCheckoutPublic` | `onNavigateToLanding`, `onNavigateToTracking` | `useNavigate()` inside component |
| `BuyerTrackingPublic` | `onNavigateToLanding` | `useNavigate()` inside component |
| `BuyerTerminal` | `onNavigateToDashboard` | `useNavigate()` inside component |
| `StorefrontPublic` | `onNavigateToLanding` | `useNavigate()` inside component |
| `LegalPagePublic` | `onNavigateToLanding` | `useNavigate()` inside component |
| `StaffLogin` | `onNavigate` | `useNavigate()` inside component |
| `AdminDashboard` | `onNavigateToLanding` | `useNavigate()` inside component |

---

## 11. FILES TO MODIFY

| File | Changes |
|---|---|
| `frontend/src/App.tsx` | Remove `currentRoute`, `navigate`, `handleURLRouting`, `getDashboardTabPath`, `getDashboardPathTab`, `urlParamsTransactionId`, `currentPath`, `activeDashboardTab`, `isUnknownRoute`. Replace with `<Routes>` + `useNavigate()` + `useLocation()` + `useParams()`. |
| `frontend/src/main.tsx` | Already has `<BrowserRouter>` — no change |
| `frontend/src/routes.ts` | Expand to actual route config or delete after migration |
| `frontend/src/components/Sidebar.tsx` | Update `onNavigateTab` to use path strings or `useNavigate()` |
| `frontend/src/components/TopNavbar.tsx` | Update navigation callbacks |
| `frontend/src/components/LandingPage.tsx` | Replace `onNavigate` prop with internal `useNavigate()` |
| `frontend/src/components/auth/AuthPage.tsx` | Replace `onNavigate` prop |
| `frontend/src/components/OnboardingFlow.tsx` | Replace `onComplete` prop |
| `frontend/src/components/NotFoundPage.tsx` | Replace `onGoHome` prop |
| `frontend/src/components/BuyerCheckoutPublic.tsx` | Replace navigation props, use `useParams()` |
| `frontend/src/components/BuyerTrackingPublic.tsx` | Replace navigation props, use `useParams()` |
| `frontend/src/components/StorefrontPublic.tsx` | Replace navigation props, use `useParams()` |
| `frontend/src/components/BuyerTerminal.tsx` | Replace navigation props |
| `frontend/src/components/LegalPagePublic.tsx` | Replace navigation props |
| `frontend/src/components/StaffLogin.tsx` | Replace `onNavigate` prop |
| `frontend/src/components/AdminDashboard.tsx` | Replace `onNavigateToLanding` prop |
| `frontend/src/components/dashboard/DashboardPage.tsx` | Update `onNavigateTab`, `onSelectBuyerCheckout` |
| `frontend/src/components/StorefrontProfile.tsx` | Update `onNavigateToTab` |

---

## 12. MIGRATION ORDER (Recommended)

### Phase A: Prepare Route Components
1. Create layout wrappers: `SellerLayout.tsx`, `AdminLayout.tsx`
2. Create `ProtectedRoute.tsx` rewrite using `useNavigate` + `Navigate`
3. Update child components to use `useNavigate()` internally instead of callback props

### Phase B: Migrate Public Routes
1. Replace top-level `if/else if` dispatch with `<Routes>` for public routes
2. Test: `/`, `/signin`, `/signup`, `/onboarding`, `/legal/*`, `/staff/login`
3. Test: `/pay/:id`, `/track/:id`, `/store/:handle`

### Phase C: Migrate Protected Routes
1. Wrap dashboard routes in `<Route element={<ProtectedRoute />}>`
2. Replace dashboard tab dispatch with nested `<Route>` children
3. Update `activeTab` derivation from URL
4. Test all dashboard tabs

### Phase D: Migrate Admin Routes
1. Wrap admin routes in `<Route element={<AdminRoute />}>`
2. Test admin access/denial

### Phase E: Cleanup
1. Delete `currentRoute`, `navigate()`, `handleURLRouting()`, `getDashboardTabPath()`, `getDashboardPathTab()`, `urlParamsTransactionId`, `currentPath`, `activeDashboardTab`, `isUnknownRoute()`, `routeVersion`
2. Delete `routes.ts` (or keep as documentation)
3. Remove `window.history.pushState` references
4. Remove `popstate` listener

---

## 13. RISKS AND MITIGATIONS

| Risk | Mitigation |
|---|---|
| Breaking all navigation during migration | Do Phase A (component prep) fully before touching App.tsx dispatch |
| Auth guard regression | Keep `ProtectedRoute` logic identical; test login/logout flow after each route change |
| Dashboard tab state loss | Derive `activeTab` from `location.pathname` with fallback to local state |
| Staff login bypass | Ensure `/staff/login` is outside `<ProtectedRoute>` wrapper |
| Browser refresh on deep links | React Router handles this automatically — verify after migration |
| Back button behavior | `<BrowserRouter>` handles `popstate` — remove custom listener |
| SEO / meta tags | Not affected — SSR not used |
| PWA service worker | No impact — SW registration is in `main.tsx` outside router |

---

## 14. WHAT DOES NOT CHANGE

- All business logic (`handleCreateEscrowLink`, `handleUpdateStatus`, `handleBatchSettlements`)
- All data fetching (`useEscrowLinks`, `usePayouts`, `useReferrals`, `useModals`)
- Auth provider and context
- Theme provider
- Toast provider
- localStorage synchronization
- Supabase queries
- Component UI and styling
- Prop names (mostly — see section 10 for callback prop changes)
- PWA setup
