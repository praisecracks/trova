/**
 * routes.ts
 * Canonical route definitions for Trova.
 *
 * This file documents the intended route structure.
 * Routes are NOT wired into rendering yet.
 * The existing custom router in App.tsx remains the source of truth for navigation.
 */

export const routes = [
  { path: '/', name: 'landing' },
  { path: '/signin', name: 'login' },
  { path: '/signup', name: 'signup' },
  { path: '/onboarding', name: 'onboarding' },
  { path: '/dashboard', name: 'dashboard' },
  { path: '/dashboard/*', name: 'dashboard-sub' },
  { path: '/pay/:id', name: 'pay' },
  { path: '/track/:id', name: 'track' },
  { path: '/store/:handle', name: 'store' },
  { path: '/admin', name: 'admin' },
  { path: '/admin/*', name: 'admin-sub' },
  { path: '/legal/privacy', name: 'privacy' },
  { path: '/legal/terms', name: 'terms' },
  { path: '/staff/login', name: 'staff-login' },
  { path: '/checkout/:id', name: 'checkout' },
] as const;

export type RouteName = typeof routes[number]['name'];
