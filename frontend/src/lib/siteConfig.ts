const defaultPublicUrl = 'https://trova.co';

export const TROVA_PUBLIC_URL = (
  (import.meta.env.VITE_TROVA_PUBLIC_URL as string | undefined) || defaultPublicUrl
).replace(/\/$/, '');

export function buildPublicUrl(path: string) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${TROVA_PUBLIC_URL}${normalizedPath}`;
}
