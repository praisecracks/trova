export interface SocialLinkInfo {
  icon: string;
  label: string;
  color: string;
  match: (url: string) => boolean;
}

export const SOCIAL_PLATFORMS: SocialLinkInfo[] = [
  {
    icon: 'Mail',
    label: 'Email',
    color: '#10b981',
    match: (url) => /^mailto:/i.test(url) || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(url)
  },
  {
    icon: 'MessageSquare',
    label: 'WhatsApp',
    color: '#25D366',
    match: (url) => /wa\.me|whatsapp\.com|^\+?[0-9]{10,15}$/.test(url)
  },
  {
    icon: 'Instagram',
    label: 'Instagram',
    color: '#E1306C',
    match: (url) => /instagram\.com|instagr\.am/.test(url)
  },
  {
    icon: 'Twitter',
    label: 'X / Twitter',
    color: '#ffffff',
    match: (url) => /twitter\.com|x\.com/.test(url)
  },
  {
    icon: 'Linkedin',
    label: 'LinkedIn',
    color: '#0A66C2',
    match: (url) => /linkedin\.com/.test(url)
  },
  {
    icon: 'Youtube',
    label: 'YouTube',
    color: '#FF0000',
    match: (url) => /youtube\.com|youtu\.be/.test(url)
  },
  {
    icon: 'Music',
    label: 'TikTok',
    color: '#ff0050',
    match: (url) => /tiktok\.com/.test(url)
  },
  {
    icon: 'Facebook',
    label: 'Facebook',
    color: '#1877F2',
    match: (url) => /facebook\.com|fb\.com|fb\.watch/.test(url)
  },
  {
    icon: 'Send',
    label: 'Telegram',
    color: '#0088cc',
    match: (url) => /t\.me|telegram\.me|telegram\.org/.test(url)
  },
  {
    icon: 'AtSign',
    label: 'Snapchat',
    color: '#FFFC00',
    match: (url) => /snapchat\.com/.test(url)
  },
  {
    icon: 'Pin',
    label: 'Pinterest',
    color: '#E60023',
    match: (url) => /pinterest\.com|pin\.it/.test(url)
  },
  {
    icon: 'Github',
    label: 'GitHub',
    color: '#ffffff',
    match: (url) => /github\.com/.test(url)
  },
  {
    icon: 'Globe',
    label: 'Website',
    color: '#71717a',
    match: () => true
  }
];

export function detectSocialPlatform(url: string): SocialLinkInfo {
  const lower = url.toLowerCase().trim();
  for (const platform of SOCIAL_PLATFORMS) {
    if (platform.match(lower)) {
      return platform;
    }
  }
  return SOCIAL_PLATFORMS[SOCIAL_PLATFORMS.length - 1];
}

export function normalizeSocialUrl(rawUrl: string): { url: string; label: string; icon: string; color: string } {
  const trimmed = rawUrl.trim();
  const platform = detectSocialPlatform(trimmed);
  
  let normalizedUrl = trimmed;
  if (!/^https?:\/\//i.test(normalizedUrl) && !/^mailto:/i.test(normalizedUrl)) {
    if (platform.icon === 'Mail') {
      normalizedUrl = `mailto:${normalizedUrl}`;
    } else {
      normalizedUrl = `https://${normalizedUrl}`;
    }
  }
  
  return {
    url: normalizedUrl,
    label: platform.label,
    icon: platform.icon,
    color: platform.color
  };
}
