/**
 * dashboard/index.ts
 * Entry point for the dashboard feature.
 * Exports DashboardPage as default to clean up import paths around the workspace.
 */

import DashboardPage from './DashboardPage';
export default DashboardPage;
export { default as DashboardHeader } from './DashboardHeader';
export { default as MetricsCards } from './MetricsCards';
export { default as EscrowTable } from './EscrowTable';
export { default as EscrowTableRow } from './EscrowTableRow';
export { default as CreateLinkModal } from './CreateLinkModal';
