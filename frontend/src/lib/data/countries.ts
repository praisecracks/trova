export interface CountryOption {
  code: string;
  name: string;
  flag: string;
  iso: string;
  length: number[];
}

export const COUNTRIES: CountryOption[] = [
  { code: '+234', name: 'Nigeria', flag: '🇳🇬', iso: 'ng', length: [10, 11] },
  { code: '+1', name: 'USA/Canada', flag: '🇺🇸', iso: 'us', length: [10] },
  { code: '+44', name: 'United Kingdom', flag: '🇬🇧', iso: 'gb', length: [10, 11] },
  { code: '+27', name: 'South Africa', flag: '🇿🇦', iso: 'za', length: [9, 10] },
  { code: '+91', name: 'India', flag: '🇮🇳', iso: 'in', length: [10] },
  { code: '+254', name: 'Kenya', flag: '🇰🇪', iso: 'ke', length: [9, 10] },
  { code: '+233', name: 'Ghana', flag: '🇬🇭', iso: 'gh', length: [9, 10] },
  { code: '+20', name: 'Egypt', flag: '🇪🇬', iso: 'eg', length: [10, 11] },
  { code: '+971', name: 'UAE', flag: '🇦🇪', iso: 'ae', length: [9, 10] },
  { code: '+86', name: 'China', flag: '🇨🇳', iso: 'cn', length: [11] },
  { code: '+61', name: 'Australia', flag: '🇦🇺', iso: 'au', length: [9, 10] },
  { code: '+55', name: 'Brazil', flag: '🇧🇷', iso: 'br', length: [10, 11] },
  { code: '+49', name: 'Germany', flag: '🇩🇪', iso: 'de', length: [10, 11] },
  { code: '+33', name: 'France', flag: '🇫🇷', iso: 'fr', length: [9, 10] },
  { code: '+31', name: 'Netherlands', flag: '🇳🇱', iso: 'nl', length: [9, 10] },
  { code: '+46', name: 'Sweden', flag: '🇸🇪', iso: 'se', length: [9, 10] },
  { code: '+47', name: 'Norway', flag: '🇳🇴', iso: 'no', length: [8, 9] },
  { code: '+45', name: 'Denmark', flag: '🇩🇰', iso: 'dk', length: [8] },
  { code: '+358', name: 'Finland', flag: '🇫🇮', iso: 'fi', length: [9, 10] },
  { code: '+48', name: 'Poland', flag: '🇵🇱', iso: 'pl', length: [9] },
  { code: '+39', name: 'Italy', flag: '🇮🇹', iso: 'it', length: [9, 10] },
  { code: '+34', name: 'Spain', flag: '🇪🇸', iso: 'es', length: [9] },
  { code: '+351', name: 'Portugal', flag: '🇵🇹', iso: 'pt', length: [9] },
  { code: '+41', name: 'Switzerland', flag: '🇨🇭', iso: 'ch', length: [9] },
  { code: '+43', name: 'Austria', flag: '🇦🇹', iso: 'at', length: [10, 11, 12, 13] },
  { code: '+353', name: 'Ireland', flag: '🇮🇪', iso: 'ie', length: [9] },
  { code: '+30', name: 'Greece', flag: '🇬🇷', iso: 'gr', length: [10] },
  { code: '+90', name: 'Turkey', flag: '🇹🇷', iso: 'tr', length: [10] },
  { code: '+966', name: 'Saudi Arabia', flag: '🇸🇦', iso: 'sa', length: [9] },
  { code: '+974', name: 'Qatar', flag: '🇶🇦', iso: 'qa', length: [8] },
  { code: '+965', name: 'Kuwait', flag: '🇰🇼', iso: 'kw', length: [8] },
  { code: '+973', name: 'Bahrain', flag: '🇧🇭', iso: 'bh', length: [8] },
  { code: '+968', name: 'Oman', flag: '🇴🇲', iso: 'om', length: [8] },
  { code: '+962', name: 'Jordan', flag: '🇯🇴', iso: 'jo', length: [9] },
  { code: '+961', name: 'Lebanon', flag: '🇱🇧', iso: 'lb', length: [8] },
  { code: '+964', name: 'Iraq', flag: '🇮🇶', iso: 'iq', length: [10, 11] },
  { code: '+98', name: 'Iran', flag: '🇮🇷', iso: 'ir', length: [10] },
  { code: '+63', name: 'Philippines', flag: '🇵🇭', iso: 'ph', length: [10] },
  { code: '+62', name: 'Indonesia', flag: '🇮🇩', iso: 'id', length: [10, 11, 12] },
  { code: '+60', name: 'Malaysia', flag: '🇲🇾', iso: 'my', length: [9, 10] },
  { code: '+65', name: 'Singapore', flag: '🇸🇬', iso: 'sg', length: [8] },
  { code: '+66', name: 'Thailand', flag: '🇹🇭', iso: 'th', length: [9, 10] },
  { code: '+84', name: 'Vietnam', flag: '🇻🇳', iso: 'vn', length: [9, 10] },
  { code: '+82', name: 'South Korea', flag: '🇰🇷', iso: 'kr', length: [9, 10] },
  { code: '+81', name: 'Japan', flag: '🇯🇵', iso: 'jp', length: [10] },
  { code: '+886', name: 'Taiwan', flag: '🇹🇼', iso: 'tw', length: [9] },
  { code: '+880', name: 'Bangladesh', flag: '🇧🇩', iso: 'bd', length: [10] },
  { code: '+92', name: 'Pakistan', flag: '🇵🇰', iso: 'pk', length: [10] },
  { code: '+94', name: 'Sri Lanka', flag: '🇱🇰', iso: 'lk', length: [9] },
  { code: '+977', name: 'Nepal', flag: '🇳🇵', iso: 'np', length: [10] },
  { code: '+255', name: 'Tanzania', flag: '🇹🇿', iso: 'tz', length: [9] },
  { code: '+256', name: 'Uganda', flag: '🇺🇬', iso: 'ug', length: [9] },
  { code: '+250', name: 'Rwanda', flag: '🇷🇼', iso: 'rw', length: [9] },
  { code: '+251', name: 'Ethiopia', flag: '🇪🇹', iso: 'et', length: [9] },
  { code: '+258', name: 'Mozambique', flag: '🇲🇿', iso: 'mz', length: [8, 9] },
  { code: '+260', name: 'Zambia', flag: '🇿🇲', iso: 'zm', length: [9] },
  { code: '+263', name: 'Zimbabwe', flag: '🇿🇼', iso: 'zw', length: [9] },
  { code: '+267', name: 'Botswana', flag: '🇧🇼', iso: 'bw', length: [8] },
  { code: '+264', name: 'Namibia', flag: '🇳🇦', iso: 'na', length: [9] },
  { code: '+232', name: 'Sierra Leone', flag: '🇸🇱', iso: 'sl', length: [8] },
  { code: '+231', name: 'Liberia', flag: '🇱🇷', iso: 'lr', length: [7, 8, 9, 10] },
  { code: '+225', name: "Ivory Coast", flag: '🇨🇮', iso: 'ci', length: [10] },
  { code: '+221', name: 'Senegal', flag: '🇸🇳', iso: 'sn', length: [9] },
  { code: '+223', name: 'Mali', flag: '🇲🇱', iso: 'ml', length: [8] },
  { code: '+226', name: 'Burkina Faso', flag: '🇧🇫', iso: 'bf', length: [8] },
  { code: '+228', name: 'Togo', flag: '🇹🇬', iso: 'tg', length: [8] },
  { code: '+229', name: 'Benin', flag: '🇧🇯', iso: 'bj', length: [8] },
  { code: '+220', name: 'Gambia', flag: '🇬🇲', iso: 'gm', length: [7] },
  { code: '+224', name: 'Guinea', flag: '🇬🇳', iso: 'gn', length: [9] },
  { code: '+245', name: 'Guinea-Bissau', flag: '🇬🇼', iso: 'gw', length: [7] },
  { code: '+238', name: 'Cape Verde', flag: '🇨🇻', iso: 'cv', length: [7] },
];

export function getCountryByCode(code: string): CountryOption | undefined {
  return COUNTRIES.find(c => c.code === code);
}

export function getCountryByPrefix(phone: string): CountryOption | undefined {
  const cleaned = phone.replace(/\D/g, '');
  return COUNTRIES.find(c => cleaned.startsWith(c.code.replace(/\D/g, '')));
}
