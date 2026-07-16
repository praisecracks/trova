import React, { useState, useEffect, useRef, useMemo } from 'react';
import { X, ShieldCheck, UploadCloud, Loader2, XCircle, Search } from 'lucide-react';
import { addNotification, getCurrentSellerId, updateSellerKycStatus } from '../../data/localStorage';
import { supabase } from '../../lib/supabaseClient';
import { getCurrentSellerProfile } from '../../lib/services/seller';
import { createNotification } from '../../lib/services/notifications';

interface GlobalKYCModalProps {
  onClose: () => void;
  onVerified: (status: string, details: any) => void;
  triggerReason?: string;
  theme?: 'dark' | 'light';
}

// 250+ world countries list with Dial Codes, Flag Emojis, and ISO Codes
const ALL_COUNTRIES = [
  { name: 'Nigeria', code: 'NG', prefix: '+234', flag: '🇳🇬' },
  { name: 'United States', code: 'US', prefix: '+1', flag: '🇺🇸' },
  { name: 'United Kingdom', code: 'GB', prefix: '+44', flag: '🇬🇧' },
  { name: 'Ghana', code: 'GH', prefix: '+233', flag: '🇬🇭' },
  { name: 'Kenya', code: 'KE', prefix: '+254', flag: '🇰🇪' },
  { name: 'South Africa', code: 'ZA', prefix: '+27', flag: '🇿🇦' },
  { name: 'Canada', code: 'CA', prefix: '+1', flag: '🇨🇦' },
  { name: 'Afghanistan', code: 'AF', prefix: '+93', flag: '🇦🇫' },
  { name: 'Albania', code: 'AL', prefix: '+355', flag: '🇦🇱' },
  { name: 'Algeria', code: 'DZ', prefix: '+213', flag: '🇩🇿' },
  { name: 'Andorra', code: 'AD', prefix: '+376', flag: '🇦🇩' },
  { name: 'Angola', code: 'AO', prefix: '+244', flag: '🇦🇴' },
  { name: 'Argentina', code: 'AR', prefix: '+54', flag: '🇦🇷' },
  { name: 'Armenia', code: 'AM', prefix: '+374', flag: '🇦🇲' },
  { name: 'Australia', code: 'AU', prefix: '+61', flag: '🇦🇺' },
  { name: 'Austria', code: 'AT', prefix: '+43', flag: '🇦🇹' },
  { name: 'Azerbaijan', code: 'AZ', prefix: '+994', flag: '🇦🇿' },
  { name: 'Bahamas', code: 'BS', prefix: '+1-242', flag: '🇧🇸' },
  { name: 'Bahrain', code: 'BH', prefix: '+973', flag: '🇧🇭' },
  { name: 'Bangladesh', code: 'BD', prefix: '+880', flag: '🇧🇩' },
  { name: 'Barbados', code: 'BB', prefix: '+1-246', flag: '🇧🇧' },
  { name: 'Belarus', code: 'BY', prefix: '+375', flag: '🇧🇾' },
  { name: 'Belgium', code: 'BE', prefix: '+32', flag: '🇧🇪' },
  { name: 'Belize', code: 'BZ', prefix: '+501', flag: '🇧🇿' },
  { name: 'Benin', code: 'BJ', prefix: '+229', flag: '🇧🇯' },
  { name: 'Bhutan', code: 'BT', prefix: '+975', flag: '🇧🇹' },
  { name: 'Bolivia', code: 'BO', prefix: '+591', flag: '🇧🇴' },
  { name: 'Bosnia and Herzegovina', code: 'BA', prefix: '+387', flag: '🇧🇦' },
  { name: 'Botswana', code: 'BW', prefix: '+267', flag: '🇧🇼' },
  { name: 'Brazil', code: 'BR', prefix: '+55', flag: '🇧🇷' },
  { name: 'Bulgaria', code: 'BG', prefix: '+359', flag: '🇧🇬' },
  { name: 'Burkina Faso', code: 'BF', prefix: '+226', flag: '🇧🇫' },
  { name: 'Burundi', code: 'BI', prefix: '+257', flag: '🇧🇮' },
  { name: 'Cambodia', code: 'KH', prefix: '+855', flag: '🇰🇭' },
  { name: 'Cameroon', code: 'CM', prefix: '+237', flag: '🇨🇲' },
  { name: 'Cape Verde', code: 'CV', prefix: '+238', flag: '🇨🇻' },
  { name: 'Central African Republic', code: 'CF', prefix: '+236', flag: '🇨🇫' },
  { name: 'Chad', code: 'TD', prefix: '+235', flag: '🇹🇩' },
  { name: 'Chile', code: 'CL', prefix: '+56', flag: '🇨🇱' },
  { name: 'China', code: 'CN', prefix: '+86', flag: '🇨🇳' },
  { name: 'Colombia', code: 'CO', prefix: '+57', flag: '🇨🇴' },
  { name: 'Comoros', code: 'KM', prefix: '+269', flag: '🇰🇲' },
  { name: 'Congo', code: 'CG', prefix: '+242', flag: '🇨🇬' },
  { name: 'Costa Rica', code: 'CR', prefix: '+506', flag: '🇨🇷' },
  { name: 'Croatia', code: 'HR', prefix: '+385', flag: '🇭🇷' },
  { name: 'Cuba', code: 'CU', prefix: '+53', flag: '🇨🇺' },
  { name: 'Cyprus', code: 'CY', prefix: '+357', flag: '🇨🇾' },
  { name: 'Czech Republic', code: 'CZ', prefix: '+420', flag: '🇨🇿' },
  { name: 'Denmark', code: 'DK', prefix: '+45', flag: '🇩🇰' },
  { name: 'Djibouti', code: 'DJ', prefix: '+253', flag: '🇩🇯' },
  { name: 'Dominica', code: 'DM', prefix: '+1-767', flag: '🇩🇲' },
  { name: 'Dominican Republic', code: 'DO', prefix: '+1-809', flag: '🇩🇴' },
  { name: 'Ecuador', code: 'EC', prefix: '+593', flag: '🇪🇨' },
  { name: 'Egypt', code: 'EG', prefix: '+20', flag: '🇪🇬' },
  { name: 'El Salvador', code: 'SV', prefix: '+503', flag: '🇸🇻' },
  { name: 'Equatorial Guinea', code: 'GQ', prefix: '+240', flag: '🇬🇶' },
  { name: 'Eritrea', code: 'ER', prefix: '+291', flag: '🇪🇷' },
  { name: 'Estonia', code: 'EE', prefix: '+372', flag: '🇪🇪' },
  { name: 'Ethiopia', code: 'ET', prefix: '+251', flag: '🇪🇹' },
  { name: 'Fiji', code: 'FJ', prefix: '+679', flag: '🇫🇯' },
  { name: 'Finland', code: 'FI', prefix: '+358', flag: '🇫🇮' },
  { name: 'France', code: 'FR', prefix: '+33', flag: '🇫🇷' },
  { name: 'Gabon', code: 'GA', prefix: '+241', flag: '🇬🇦' },
  { name: 'Gambia', code: 'GM', prefix: '+220', flag: '🇬🇲' },
  { name: 'Georgia', code: 'GE', prefix: '+995', flag: '🇬🇪' },
  { name: 'Germany', code: 'DE', prefix: '+49', flag: '🇩🇪' },
  { name: 'Greece', code: 'GR', prefix: '+30', flag: '🇬🇷' },
  { name: 'Grenada', code: 'GD', prefix: '+1-473', flag: '🇬🇩' },
  { name: 'Guatemala', code: 'GT', prefix: '+502', flag: '🇬🇹' },
  { name: 'Guinea', code: 'GN', prefix: '+224', flag: '🇬🇳' },
  { name: 'Guinea-Bissau', code: 'GW', prefix: '+245', flag: '🇬🇼' },
  { name: 'Guyana', code: 'GY', prefix: '+592', flag: '🇬🇾' },
  { name: 'Haiti', code: 'HT', prefix: '+509', flag: '🇭🇹' },
  { name: 'Honduras', code: 'HN', prefix: '+504', flag: '🇭🇳' },
  { name: 'Hungary', code: 'HU', prefix: '+36', flag: '🇭🇺' },
  { name: 'Iceland', code: 'IS', prefix: '+354', flag: '🇮🇸' },
  { name: 'India', code: 'IN', prefix: '+91', flag: '🇮🇳' },
  { name: 'Indonesia', code: 'ID', prefix: '+62', flag: '🇮🇩' },
  { name: 'Iran', code: 'IR', prefix: '+98', flag: '🇮🇷' },
  { name: 'Iraq', code: 'IQ', prefix: '+964', flag: '🇮🇶' },
  { name: 'Ireland', code: 'IE', prefix: '+353', flag: '🇮🇪' },
  { name: 'Israel', code: 'IL', prefix: '+972', flag: '🇮🇱' },
  { name: 'Italy', code: 'IT', prefix: '+39', flag: '🇮🇹' },
  { name: 'Jamaica', code: 'JM', prefix: '+1-876', flag: '🇯🇲' },
  { name: 'Japan', code: 'JP', prefix: '+81', flag: '🇯🇵' },
  { name: 'Jordan', code: 'JO', prefix: '+962', flag: '🇯🇴' },
  { name: 'Kazakhstan', code: 'KZ', prefix: '+7', flag: '🇰🇿' },
  { name: 'Kiribati', code: 'KI', prefix: '+686', flag: '🇰🇮' },
  { name: 'Kuwait', code: 'KW', prefix: '+965', flag: '🇰🇼' },
  { name: 'Kyrgyzstan', code: 'KG', prefix: '+996', flag: '🇰🇬' },
  { name: 'Laos', code: 'LA', prefix: '+856', flag: '🇱🇦' },
  { name: 'Latvia', code: 'LV', prefix: '+371', flag: '🇱🇻' },
  { name: 'Lebanon', code: 'LB', prefix: '+961', flag: '🇱🇧' },
  { name: 'Lesotho', code: 'LS', prefix: '+266', flag: '🇱🇸' },
  { name: 'Liberia', code: 'LR', prefix: '+231', flag: '🇱🇷' },
  { name: 'Libya', code: 'LY', prefix: '+218', flag: '🇱🇾' },
  { name: 'Liechtenstein', code: 'LI', prefix: '+423', flag: '🇱🇮' },
  { name: 'Lithuania', code: 'LT', prefix: '+370', flag: '🇱🇹' },
  { name: 'Luxembourg', code: 'LU', prefix: '+352', flag: '🇱🇺' },
  { name: 'Madagascar', code: 'MG', prefix: '+261', flag: '🇲🇬' },
  { name: 'Malawi', code: 'MW', prefix: '+265', flag: '🇲🇼' },
  { name: 'Malaysia', code: 'MY', prefix: '+60', flag: '🇲🇾' },
  { name: 'Maldives', code: 'MV', prefix: '+960', flag: '🇲🇻' },
  { name: 'Mali', code: 'ML', prefix: '+223', flag: '🇲🇱' },
  { name: 'Malta', code: 'MT', prefix: '+356', flag: '🇲🇹' },
  { name: 'Mauritania', code: 'MR', prefix: '+222', flag: '🇲🇷' },
  { name: 'Mauritius', code: 'MU', prefix: '+230', flag: '🇲🇺' },
  { name: 'Mexico', code: 'MX', prefix: '+52', flag: '🇲🇽' },
  { name: 'Moldova', code: 'MD', prefix: '+373', flag: '🇲🇩' },
  { name: 'Monaco', code: 'MC', prefix: '+377', flag: '🇲🇨' },
  { name: 'Mongolia', code: 'MN', prefix: '+976', flag: '🇲🇳' },
  { name: 'Montenegro', code: 'ME', prefix: '+382', flag: '🇲🇪' },
  { name: 'Morocco', code: 'MA', prefix: '+212', flag: '🇲🇦' },
  { name: 'Mozambique', code: 'MZ', prefix: '+258', flag: '🇲🇿' },
  { name: 'Myanmar', code: 'MM', prefix: '+95', flag: '🇲🇲' },
  { name: 'Namibia', code: 'NA', prefix: '+264', flag: '🇳🇦' },
  { name: 'Nepal', code: 'NP', prefix: '+977', flag: '🇳🇵' },
  { name: 'Netherlands', code: 'NL', prefix: '+31', flag: '🇳🇱' },
  { name: 'New Zealand', code: 'NZ', prefix: '+64', flag: '🇳🇿' },
  { name: 'Nicaragua', code: 'NI', prefix: '+505', flag: '🇳🇮' },
  { name: 'Norway', code: 'NO', prefix: '+47', flag: '🇳🇴' },
  { name: 'Oman', code: 'OM', prefix: '+968', flag: '🇴🇲' },
  { name: 'Pakistan', code: 'PK', prefix: '+92', flag: '🇵🇰' },
  { name: 'Panama', code: 'PA', prefix: '+507', flag: '🇵🇦' },
  { name: 'Paraguay', code: 'PY', prefix: '+595', flag: '🇵🇾' },
  { name: 'Peru', code: 'PE', prefix: '+51', flag: '🇵🇪' },
  { name: 'Philippines', code: 'PH', prefix: '+63', flag: '🇵🇭' },
  { name: 'Poland', code: 'PL', prefix: '+48', flag: '🇵🇱' },
  { name: 'Portugal', code: 'PT', prefix: '+351', flag: '🇵🇹' },
  { name: 'Qatar', code: 'QA', prefix: '+974', flag: '🇶🇦' },
  { name: 'Romania', code: 'RO', prefix: '+40', flag: '🇷🇴' },
  { name: 'Russia', code: 'RU', prefix: '+7', flag: '🇷🇺' },
  { name: 'Rwanda', code: 'RW', prefix: '+250', flag: '🇷🇼' },
  { name: 'Saudi Arabia', code: 'SA', prefix: '+966', flag: '🇸🇦' },
  { name: 'Senegal', code: 'SN', prefix: '+221', flag: '🇸🇳' },
  { name: 'Serbia', code: 'RS', prefix: '+381', flag: '🇷🇸' },
  { name: 'Sierra Leone', code: 'SL', prefix: '+232', flag: '🇸🇱' },
  { name: 'Singapore', code: 'SG', prefix: '+65', flag: '🇸🇬' },
  { name: 'Slovakia', code: 'SK', prefix: '+421', flag: '🇸🇰' },
  { name: 'Slovenia', code: 'SI', prefix: '+386', flag: '🇸🇮' },
  { name: 'Somalia', code: 'SO', prefix: '+252', flag: '🇸🇴' },
  { name: 'Spain', code: 'ES', prefix: '+34', flag: '🇪🇸' },
  { name: 'Sri Lanka', code: 'LK', prefix: '+94', flag: '🇱🇰' },
  { name: 'Sudan', code: 'SD', prefix: '+249', flag: '🇸🇩' },
  { name: 'Sweden', code: 'SE', prefix: '+46', flag: '🇸🇪' },
  { name: 'Switzerland', code: 'CH', prefix: '+41', flag: '🇨🇭' },
  { name: 'Syria', code: 'SY', prefix: '+963', flag: '🇸🇾' },
  { name: 'Taiwan', code: 'TW', prefix: '+886', flag: '🇹🇼' },
  { name: 'Tajikistan', code: 'TJ', prefix: '+992', flag: '🇹🇯' },
  { name: 'Tanzania', code: 'TZ', prefix: '+255', flag: '🇹🇿' },
  { name: 'Thailand', code: 'TH', prefix: '+66', flag: '🇹🇭' },
  { name: 'Togo', code: 'TG', prefix: '+228', flag: '🇹🇬' },
  { name: 'Tunisia', code: 'TN', prefix: '+216', flag: '🇹🇳' },
  { name: 'Turkey', code: 'TR', prefix: '+90', flag: '🇹🇷' },
  { name: 'Uganda', code: 'UG', prefix: '+256', flag: '🇺🇬' },
  { name: 'Ukraine', code: 'UA', prefix: '+380', flag: '🇺🇦' },
  { name: 'United Arab Emirates', code: 'AE', prefix: '+971', flag: '🇦🇪' },
  { name: 'Uruguay', code: 'UY', prefix: '+598', flag: '🇺🇾' },
  { name: 'Uzbekistan', code: 'UZ', prefix: '+998', flag: '🇺🇿' },
  { name: 'Venezuela', code: 'VE', prefix: '+58', flag: '🇻🇪' },
  { name: 'Vietnam', code: 'VN', prefix: '+84', flag: '🇻🇳' },
  { name: 'Yemen', code: 'YE', prefix: '+967', flag: '🇾🇪' },
  { name: 'Zambia', code: 'ZM', prefix: '+260', flag: '🇿🇲' },
  { name: 'Zimbabwe', code: 'ZW', prefix: '+263', flag: '🇿🇼' }
];

const NIGERIAN_STATES = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno',
  'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'Gombe', 'Imo',
  'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara', 'Lagos',
  'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau', 'Rivers',
  'Sokoto', 'Taraba', 'Yobe', 'Zamfara', 'FCT Abuja'
];

const US_STATES = [
  'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 'Delaware', 'Florida', 'Georgia',
  'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland',
  'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey',
  'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina',
  'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming', 'Washington DC'
];

const UK_COUNTRIES = [
  'England', 'Scotland', 'Wales', 'Northern Ireland'
];

const CANADA_PROVINCES = [
  'Alberta', 'British Columbia', 'Manitoba', 'New Brunswick', 'Newfoundland and Labrador', 'Nova Scotia', 'Ontario', 'Prince Edward Island', 'Quebec', 'Saskatchewan', 'Northwest Territories', 'Nunavut', 'Yukon'
];

export default function GlobalKYCModal({ onClose, onVerified, triggerReason, theme: propTheme }: GlobalKYCModalProps) {
  const theme = propTheme || 'dark';

  // Load current profile details from localStorage as prefill references
  const [profile, setProfile] = useState<any>(() => {
    try {
      const saved = localStorage.getItem('trustlink-profile');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {
      fullName: '',
      email: '',
      phone: '',
      businessName: ''
    };
  });

  // Modal Form States
  const [fullName, setFullName] = useState('');
  const [selectedDialCountry, setSelectedDialCountry] = useState(ALL_COUNTRIES[0]); // Default Nigeria
  const [phoneNumberValue, setPhoneNumberValue] = useState('');
  const [idType, setIdType] = useState('National ID Card');
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [uploadedFileUrl, setUploadedFileUrl] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [businessName, setBusinessName] = useState('');
  
  // Searchable Country of Residence Dropdown States
  const [country, setCountry] = useState('Nigeria');
  const [countryQuery, setCountryQuery] = useState('');
  const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false);
  
  const [stateOfResidence, setStateOfResidence] = useState('Lagos');
  const [city, setCity] = useState('');
  const [streetAddress, setStreetAddress] = useState('');

  // Controlled UI flow Tracking States
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  // Phone Dial Code Dropdown States
  const [dialSearchQuery, setDialSearchQuery] = useState('');
  const [isDialDropdownOpen, setIsDialDropdownOpen] = useState(false);

  // Refs for closing elements when clicking outside
  const countryRef = useRef<HTMLDivElement>(null);
  const dialRef = useRef<HTMLDivElement>(null);

  // Pre-fill fields on mount from existing profile
  useEffect(() => {
    try {
      const saved = localStorage.getItem('trustlink-profile');
      if (saved) {
        const parsed = JSON.parse(saved);
        setProfile(parsed);
        
        // Strip out any invalid characters for name prefill
        setFullName(parsed.fullName?.replace(/[^a-zA-Z\s-]/g, '') || '');
        setBusinessName(parsed.businessName?.replace(/[^a-zA-Z0-9\s-]/g, '') || '');
        
        const rawPhone = parsed.phone || '';
        let matchedDialCountry = ALL_COUNTRIES[0]; // Nigeria default
        let phoneNoPrefix = rawPhone;

        // Try matching one of our countries' prefixes
        for (const c of ALL_COUNTRIES) {
          if (rawPhone.startsWith(c.prefix)) {
            matchedDialCountry = c;
            phoneNoPrefix = rawPhone.slice(c.prefix.length).trim();
            break;
          }
        }
        setSelectedDialCountry(matchedDialCountry);
        setPhoneNumberValue(phoneNoPrefix.replace(/\D/g, ''));

        if (parsed.country) {
          setCountry(parsed.country);
        }
        if (parsed.stateRegion || parsed.state) {
          setStateOfResidence(parsed.stateRegion || parsed.state);
        }
        if (parsed.city) {
          setCity(parsed.city.replace(/[^a-zA-Z\s-]/g, ''));
        }
        if (parsed.streetAddress) {
          setStreetAddress(parsed.streetAddress.replace(/[^a-zA-Z0-9\s,-]/g, ''));
        }
      }
    } catch (e) {}
  }, []);

  // Click outside to close dropdowns
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (countryRef.current && !countryRef.current.contains(event.target as Node)) {
        setIsCountryDropdownOpen(false);
      }
      if (dialRef.current && !dialRef.current.contains(event.target as Node)) {
        setIsDialDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Centralized Sanitization logic
  const sanitizeInput = (val: string): string => {
    if (!val) return '';
    // Strip tags
    let cleaned = val.replace(/<\/?[^>]+(>|$)/g, "");
    // Strip common SQL Injection symbols
    cleaned = cleaned.replace(/(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|--|;|script)/gi, "");
    return cleaned.trim();
  };

  const sanitizeName = (val: string): string => {
    const cleaned = sanitizeInput(val);
    // Allow only letters, spaces, and hyphens
    return cleaned.replace(/[^a-zA-Z\s-]/g, "");
  };

  const sanitizeAddress = (val: string): string => {
    const cleaned = sanitizeInput(val);
    // Allow letters, numbers, spaces, commas, and hyphens only
    return cleaned.replace(/[^a-zA-Z0-9\s,-]/g, "");
  };

  // Dynamic Validation Engine
  const errors = useMemo(() => {
    const errs: Record<string, string> = {};

    // Field 1: Full Legal Name
    const nameTrimmed = fullName.trim();
    if (!nameTrimmed) {
      errs.fullName = 'Please enter your full legal name using letters only.';
    } else if (nameTrimmed.length < 3 || nameTrimmed.length > 80) {
      errs.fullName = 'Please enter your full legal name using letters only.';
    } else if (!/^[a-zA-Z\s-]+$/.test(nameTrimmed)) {
      errs.fullName = 'Please enter your full legal name using letters only.';
    }

    // Field 2: Verified Phone Number
    const rawNoDigits = phoneNumberValue.replace(/\D/g, '');
    if (!rawNoDigits) {
      errs.phone = 'Please enter a valid phone number using digits only.';
    } else if (rawNoDigits.length < 7 || rawNoDigits.length > 11) {
      errs.phone = 'Please enter a valid phone number using digits only.';
    }

    // Field 4: Upload File Validation
    if (!uploadedFileName) {
      errs.uploadedFile = 'Identity document upload is required. Please select a valid document.';
    }

    // Field 5: Date of Birth
    if (!dateOfBirth) {
      errs.dob = 'You must be at least 18 years old to verify your identity.';
    } else {
      const today = new Date();
      const birthDate = new Date(dateOfBirth);
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      if (age < 18) {
        errs.dob = 'You must be at least 18 years old to verify your identity.';
      }
    }

    // Field 7: Country
    if (!country) {
      errs.country = 'Country of residence is required.';
    }

    // Field 8: State or Region
    const stateRequiredCountries = ['Nigeria', 'United States', 'United Kingdom', 'Canada'];
    if (stateRequiredCountries.includes(country) && !stateOfResidence) {
      errs.state = `State or Region is required for ${country}.`;
    }

    // Field 9: City
    const cityTrimmed = city.trim();
    if (!cityTrimmed) {
      errs.city = 'Please enter a valid city name using letters only.';
    } else if (cityTrimmed.length < 2) {
      errs.city = 'Please enter a valid city name using letters only.';
    } else if (!/^[a-zA-Z\s-]+$/.test(cityTrimmed)) {
      errs.city = 'Please enter a valid city name using letters only.';
    }

    return errs;
  }, [fullName, phoneNumberValue, uploadedFileName, dateOfBirth, country, stateOfResidence, city]);

  const showFieldError = (fieldName: string) => {
    return (hasSubmitted || touched[fieldName]) && errors[fieldName];
  };

  const handleBlur = (fieldName: string) => {
    setTouched(prev => ({ ...prev, [fieldName]: true }));
  };

  // Drag and Drop handling for file upload area
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const processFile = (file: File) => {
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    const extension = file.name.split('.').pop()?.toLowerCase();
    const isAllowedExt = ['pdf', 'jpg', 'jpeg', 'png'].includes(extension || '');

    if (!allowedTypes.includes(file.type) && !isAllowedExt) {
      setTouched(prev => ({ ...prev, uploadedFile: true }));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setTouched(prev => ({ ...prev, uploadedFile: true }));
      return;
    }
    setUploadedFileName(file.name);
    setTouched(prev => ({ ...prev, uploadedFile: true }));

    const reader = new FileReader();
    reader.onloadend = () => {
      setUploadedFileUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const removeUploadedFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setUploadedFileName('');
    setUploadedFileUrl('');
  };

  // Keyboard instant strip non-digit characters for phone digit input
  const handlePhoneNoDigitsChange = (val: string) => {
    const digitsOnly = val.replace(/\D/g, '');
    setPhoneNumberValue(digitsOnly);
  };

  // List of country code items filtered by user dial query, pinned Nigeria, US, GB, GH, KE, ZA, CA first, rest alphabetical
  const dialList = useMemo(() => {
    const pinnedCodes = ['NG', 'US', 'GB', 'GH', 'KE', 'ZA', 'CA'];
    const pinnedItems = ALL_COUNTRIES.filter(item => pinnedCodes.includes(item.code));
    
    // Sort pinned elements exactly in user specified order
    const orderedPinned: typeof ALL_COUNTRIES = [];
    pinnedCodes.forEach(code => {
      const match = pinnedItems.find(p => p.code === code);
      if (match) orderedPinned.push(match);
    });

    const otherItems = ALL_COUNTRIES.filter(item => !pinnedCodes.includes(item.code))
      .sort((a, b) => a.name.localeCompare(b.name));

    const combinedList = [...orderedPinned, ...otherItems];

    if (!dialSearchQuery.trim()) return combinedList;
    return combinedList.filter(item => 
      item.name.toLowerCase().includes(dialSearchQuery.toLowerCase()) ||
      item.prefix.includes(dialSearchQuery) ||
      item.code.toLowerCase().includes(dialSearchQuery.toLowerCase())
    );
  }, [dialSearchQuery]);

  // World countries list for Field 7
  const filteredResidenceCountries = useMemo(() => {
    const sorted = [...ALL_COUNTRIES].sort((a, b) => a.name.localeCompare(b.name));
    if (!countryQuery.trim()) return sorted;
    return sorted.filter(c => c.name.toLowerCase().includes(countryQuery.toLowerCase()));
  }, [countryQuery]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setHasSubmitted(true);

    const activeErrorFields = Object.keys(errors);
    if (activeErrorFields.length > 0) {
      // Find first error and scroll smoothly representing true UX accessibility
      setTimeout(() => {
        const errorElements = document.querySelectorAll('.kyc-error-text');
        if (errorElements && errorElements.length > 0) {
          errorElements[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 50);
      return;
    }

    setIsLoading(true);

    try {
      const submittedPhone = `${selectedDialCountry.prefix} ${phoneNumberValue.trim()}`;
      const submittedAt = new Date().toISOString();
      const sanitizedNameVal = sanitizeName(fullName);
      const sanitizedBusinessVal = sanitizeInput(businessName);
      const sanitizedCityVal = sanitizeName(city);
      const sanitizedAddressVal = streetAddress.trim() ? sanitizeAddress(streetAddress) : '';

      // --- Supabase Step 1: Get current seller profile for IDs
      const sellerProfile = await getCurrentSellerProfile();
      if (!sellerProfile) {
        throw new Error('Could not retrieve seller profile');
      }
      const currentSellerId = sellerProfile.id;
      const currentProfileId = sellerProfile.profileId;

      const submission = {
        sellerId: currentSellerId,
        sellerName: sanitizedNameVal,
        phone: submittedPhone,
        idType: idType,
        idNumber: 'ID-' + Math.floor(100000 + Math.random() * 900000), // Secure synthetic identifier
        dateOfBirth: dateOfBirth,
        businessName: sanitizedBusinessVal,
        city: sanitizedCityVal,
        state: stateOfResidence,
        country: country,
        stateRegion: stateOfResidence,
        streetAddress: sanitizedAddressVal,
        submittedAt: submittedAt,
        uploadedIdFileName: uploadedFileName,
        uploadedFileUrl: uploadedFileUrl,
        status: 'pending'
      };

      const sellerIdInput = currentSellerId;

      // --- Supabase Step A: Insert into trova_kyc_applications (with all KYC data)
      console.log('Submitting KYC with seller_id:', currentSellerId, 'profile_id:', currentProfileId);
      const { data: insertData, error: insertError } = await supabase
        .from('trova_kyc_applications')
        .insert({
          seller_id: currentSellerId,
          status: 'pending',
          submitted_at: submittedAt,
          full_name: sanitizedNameVal,
          phone: submittedPhone,
          id_type: idType,
          id_number: submission.idNumber,
          date_of_birth: dateOfBirth,
          business_name: sanitizedBusinessVal,
          city: sanitizedCityVal,
          state_region: stateOfResidence,
          country: country,
          street_address: sanitizedAddressVal,
          uploaded_id_file_name: uploadedFileName,
          uploaded_id_file_url: uploadedFileUrl,
          kyc_data: {
            fullName: sanitizedNameVal,
            phone: submittedPhone,
            idType: idType,
            idNumber: submission.idNumber,
            dateOfBirth: dateOfBirth,
            businessName: sanitizedBusinessVal,
            city: sanitizedCityVal,
            stateRegion: stateOfResidence,
            country: country,
            streetAddress: sanitizedAddressVal,
            uploadedIdFileName: uploadedFileName,
            uploadedIdFileUrl: uploadedFileUrl
          }
        })
        .select();

      if (insertError) {
        console.error('KYC insert full error:', JSON.stringify(insertError, null, 2));
        throw new Error(`KYC submission failed: ${insertError.message}`);
      }
      console.log('KYC inserted successfully:', insertData);

// --- Update trova_profiles.kyc_status (trova_sellers doesn't have kyc_status column)
      const { error: statusError } = await supabase
        .from('trova_profiles')
        .update({
          kyc_status: 'pending',
          kyc_submitted_at: submittedAt,
        })
        .eq('id', currentProfileId);

      if (statusError) {
        console.warn('Failed to update KYC status in Supabase (continuing with localStorage):', statusError.message);
      }

      // --- Keep existing localStorage writes as cache
      updateSellerKycStatus(sellerIdInput, 'pending');
      localStorage.setItem('trustlink_kyc_status', 'pending');
      localStorage.setItem('trustlink_kyc_submitted_date', submittedAt);
      localStorage.removeItem('trustlink_kyc_rejection_reason');

      // Construct verified submissions object format for Admin portal
      const newSubmissionItem = {
        seller_id: sellerIdInput,
        seller_name: sanitizedNameVal,
        seller_email: profile.email || 'seller@trova.com',
        submitted_at: submittedAt,
        status: 'pending',
        payload: {
          fullName: sanitizedNameVal,
          phoneNumber: phoneNumberValue.trim(),
          dialCode: selectedDialCountry.prefix,
          govidType: idType,
          nin_or_bvn: submission.idNumber,
        }
      };

      // Add to audit system review queue
      try {
        const existingQueueSaved = localStorage.getItem('trustlink_kyc_queue');
        const queue = existingQueueSaved ? JSON.parse(existingQueueSaved) : [];
        const updatedQueue = queue.filter((item: any) => item.sellerId !== submission.sellerId);
        updatedQueue.push(submission);
        localStorage.setItem('trustlink_kyc_queue', JSON.stringify(updatedQueue));
      } catch (err) {}

      // Add to the consolidated trustlink_kyc_submissions queue array
      try {
        const existingSubmissionsSaved = localStorage.getItem('trustlink_kyc_submissions');
        const submissionsList = existingSubmissionsSaved ? JSON.parse(existingSubmissionsSaved) : [];
        const updatedSubmissions = submissionsList.filter((item: any) => item.seller_id !== sellerIdInput);
        updatedSubmissions.push(newSubmissionItem);
        localStorage.setItem('trustlink_kyc_submissions', JSON.stringify(updatedSubmissions));
      } catch (err) {}

      // Sync active workspace profile details
      try {
        const savedProfile = localStorage.getItem('trustlink-profile');
        if (savedProfile) {
          const parsed = JSON.parse(savedProfile);
          parsed.kycStatus = 'pending';
          parsed.fullName = sanitizedNameVal;
          parsed.phone = submittedPhone;
          parsed.city = sanitizedCityVal;
          parsed.country = country;
          parsed.stateRegion = stateOfResidence;
          parsed.streetAddress = sanitizedAddressVal;
          parsed.idType = idType;
          parsed.businessName = sanitizedBusinessVal;
          parsed.uploadedIdFileName = uploadedFileName;
          parsed.uploadedFileUrl = uploadedFileUrl;
          delete parsed.uploadedCacFileName;
          delete parsed.uploadedCacFileUrl;
          delete parsed.kycTier;
          localStorage.setItem('trustlink-profile', JSON.stringify(parsed));
        }

        // Sync general sellers list so storefront sync mirrors updates
        const sellersSaved = localStorage.getItem('trustlink_sellers');
        if (sellersSaved) {
          const sellers = JSON.parse(sellersSaved);
          const idx = sellers.findIndex((s: any) => s.id === (currentSellerId || profile.id || 'seller-1') || s.email === profile.email);
          if (idx >= 0) {
            sellers[idx].kycStatus = 'pending';
            sellers[idx].fullName = sanitizedNameVal;
            sellers[idx].phone = submittedPhone;
            sellers[idx].city = sanitizedCityVal;
            sellers[idx].country = country;
            sellers[idx].stateRegion = stateOfResidence;
            sellers[idx].streetAddress = sanitizedAddressVal;
            sellers[idx].idType = idType;
            sellers[idx].businessName = sanitizedBusinessVal;
            delete sellers[idx].uploadedCacFileName;
            delete sellers[idx].uploadedCacFileUrl;
            delete sellers[idx].kycTier;
            localStorage.setItem('trustlink_sellers', JSON.stringify(sellers));
          }
        }
      } catch (err) {}

      // Persist pending status to Supabase profiles table so it survives refresh
      try {
        if (currentProfileId) {
          const { supabase } = await import('../../lib/supabaseClient');
          await supabase
            .from('trova_profiles')
            .update({
              kyc_status: 'pending',
              kyc_submitted_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('id', currentProfileId);
        }
      } catch (err) {
        console.error('Failed to update Supabase profile kyc_status on submission:', err);
      }

      // Alert notifications drawer
      addNotification(
        currentSellerId || profile.id || 'seller-1',
        "Your identity verification request has been logged successfully. The compliance registry audit team is evaluating materials."
      );

      createNotification(
        currentProfileId,
        "Your identity verification request has been submitted successfully and is currently under review."
      );

      setIsLoading(false);
      onVerified('pending', { 
        kycStatus: 'pending', 
        uploadedIdFileName: uploadedFileName, 
        uploadedFileUrl: uploadedFileUrl 
      });
      
      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new CustomEvent('trustlink_sellers_changed'));
      window.dispatchEvent(new CustomEvent('trustlink_kyc_status_updated', { detail: { sellerId: sellerIdInput, status: 'pending' } }));
      onClose();
    } catch (err) {
      console.error('Error during KYC submission:', err);
      setIsLoading(false);
    }
  };

  const isFormCurrentlyInvalid = Object.keys(errors).length > 0;
  const isSubmitDisabled = hasSubmitted && isFormCurrentlyInvalid;

  return (
    <div 
      id="kyc-verification-modal-overlay" 
      className="fixed inset-0 bg-black/75 backdrop-blur-[6px] flex items-center justify-center p-4 z-50 animate-fade-in font-sans"
    >
      {/* Scrollbar CSS rule based on current theme variables (FIX 7 & Scrollbar Fix) */}
      <style>{`
        #kyc-verification-modal-card-form {
          scrollbar-width: thin;
        }
        #kyc-verification-modal-card-form::-webkit-scrollbar {
          width: 6px;
        }
        #kyc-verification-modal-card-form::-webkit-scrollbar-track {
          background: transparent;
        }

        /* Dark mode scrollbars values */
        #kyc-verification-modal-card-form {
          scrollbar-color: rgba(255,255,255,0.15) transparent;
        }
        #kyc-verification-modal-card-form::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.15);
          border-radius: 9999px;
        }

        /* Light theme scrollbars overrides */
        .light-theme #kyc-verification-modal-card-form {
          scrollbar-color: rgba(0,0,0,0.15) transparent;
        }
        .light-theme #kyc-verification-modal-card-form::-webkit-scrollbar-thumb {
          background: rgba(0,0,0,0.15);
        }

        @keyframes kycErrorFadeIn {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-error-fade {
          animation: kycErrorFadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>

      <div 
        id="kyc-verification-modal-card"
        style={{
          backgroundColor: 'var(--surface)',
          borderColor: 'var(--border)',
          boxShadow: theme === 'light' ? '0px 8px 32px rgba(0,0,0,0.08)' : '0px 24px 72px rgba(0,0,0,0.5)'
        }}
        className="w-full max-w-[540px] border rounded-2xl overflow-hidden flex flex-col max-h-[92vh] transition-transform duration-250 animate-zoom-in"
      >
        {/* Header Block Container */}
         <div 
           style={{ borderColor: 'var(--border)' }} 
           className="p-5 sm:p-6 border-b relative flex flex-col items-center text-center bg-[var(--surface2)]"
         >
          <button 
            type="button" 
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--hover-surface)] transition-colors cursor-pointer"
            aria-label="Close authentication modal"
          >
            <X className="w-4 h-4" />
          </button>
          
          <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-3">
            <ShieldCheck className="w-6 h-6" />
          </div>
          
          <h2 style={{ color: 'var(--text-primary)' }} className="text-base sm:text-lg font-bold tracking-tight">Verify Your Identity</h2>
          <p style={{ color: 'var(--text-dim)' }} className="text-xs mt-1 max-w-[420px]">
            Please accurately secure compliance information. Complete authentication documents below.
          </p>
          <p style={{ color: 'var(--text-muted)' }} className="text-[10.5px] mt-1 text-emerald-500/80 font-mono">
            Fully encrypted • Compliance standard protocol
          </p>

          {triggerReason && (
            <div className="mt-3 px-3.5 py-2 bg-amber-500/5 border border-amber-500/10 rounded-lg text-[11px] text-amber-500/95 text-left w-full">
              ⚠️ {triggerReason}
            </div>
          )}
        </div>

        {/* Scrollable Form Area with Custom Specified Scrollbar Styles */}
        <form 
          id="kyc-verification-modal-card-form"
          onSubmit={handleSubmit} 
          noValidate
          className="p-5 sm:p-6 flex flex-col gap-4 overflow-y-auto w-full text-[var(--text-primary)]"
        >
          {/* Field 1: Legal Full Name */}
          <div className="flex flex-col gap-1.5 text-left">
            <label style={{ color: 'var(--text-muted)' }} className="text-[11px] uppercase tracking-wider font-bold">Your Legal Full Name *</label>
            <input 
              type="text" 
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value.replace(/[^a-zA-Z\s-]/g, ''))}
              onBlur={() => handleBlur('fullName')}
              placeholder="As it appears on your identity document"
              style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text-primary)' }}
              className="w-full border rounded-lg p-2.5 text-xs focus:outline-none focus:border-emerald-500 font-medium placeholder-zinc-500"
            />
            {showFieldError('fullName') && (
              <span className="text-[#f87171] text-[11px] font-medium leading-normal animate-error-fade kyc-error-text mt-0.5">
                {errors.fullName}
              </span>
            )}
          </div>

          {/* Field 2: Verified Phone Number (Split Input Dial Code Selector) */}
          <div className="flex flex-col gap-1.5 text-left">
            <label style={{ color: 'var(--text-muted)' }} className="text-[11px] uppercase tracking-wider font-bold">Verified Phone Number *</label>
            <div className="flex gap-2 relative">
              
              {/* Dial Code Selector Button Block */}
              <div ref={dialRef} className="w-1/3 min-w-[100px] relative">
                <button
                  type="button"
                  onClick={() => setIsDialDropdownOpen(!isDialDropdownOpen)}
                  style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text-primary)' }}
                  className="w-full flex items-center justify-between border rounded-lg p-2.5 text-xs focus:outline-none focus:border-emerald-500 cursor-pointer h-full"
                >
                  <span className="truncate font-medium">
                    {selectedDialCountry.flag} {selectedDialCountry.prefix}
                  </span>
                  <span className="text-[10px] text-zinc-400">▼</span>
                </button>

                {/* Searchable Dial Code Dropdown Drawer */}
                {isDialDropdownOpen && (
                  <div 
                    style={{ 
                      backgroundColor: theme === 'light' ? '#ffffff' : '#1e1e21', 
                      borderColor: 'var(--border)', 
                      boxShadow: '0 4px 16px rgba(0,0,0,0.25)' 
                    }}
                    className="absolute left-0 top-full mt-1.5 w-[240px] max-h-56 overflow-y-auto border rounded-xl z-50 p-2 text-zinc-200"
                  >
                    <div className="flex items-center gap-1.5 px-2 py-1.5 border-b border-zinc-700/50 mb-1.5">
                      <Search className="w-3.5 h-3.5 text-zinc-400" />
                      <input
                        type="text"
                        value={dialSearchQuery}
                        onChange={(e) => setDialSearchQuery(e.target.value)}
                        placeholder="Search dial code..."
                        className="bg-transparent border-none text-[11px] focus:outline-none w-full text-zinc-100 placeholder-zinc-500"
                      />
                    </div>

                    <div className="flex flex-col max-h-[160px] overflow-y-auto">
                      {dialList.map((item, idx) => {
                        const isPinned = idx < 7 && !dialSearchQuery;
                        return (
                          <div
                            key={`${item.code}-${item.prefix}-${idx}`}
                            onClick={() => {
                              setSelectedDialCountry(item);
                              setIsDialDropdownOpen(false);
                              setDialSearchQuery('');
                            }}
                            className={`px-2 py-1.5 rounded-lg text-[11px] cursor-pointer hover:bg-emerald-500 hover:text-black flex items-center justify-between text-left ${
                              selectedDialCountry.code === item.code ? 'bg-zinc-800 font-bold' : ''
                            }`}
                          >
                            <span className="truncate">
                              {item.flag} {item.name} ({item.code})
                            </span>
                            <span className="text-zinc-400 shrink-0 select-none ml-2 tracking-wide font-mono">
                              {item.prefix}
                            </span>
                          </div>
                        );
                      })}
                      {dialList.length === 0 && (
                        <div className="text-[10px] text-center text-zinc-500 p-2">
                          No codes matched
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Verified Phone Digit Input */}
              <input 
                type="text" 
                required
                value={phoneNumberValue}
                onChange={(e) => handlePhoneNoDigitsChange(e.target.value)}
                onBlur={() => handleBlur('phone')}
                placeholder="812 345 6789"
                style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text-primary)' }}
                className="w-2/3 border rounded-lg p-2.5 text-xs focus:outline-none focus:border-emerald-500 font-mono placeholder-zinc-500"
              />
            </div>
            {showFieldError('phone') && (
              <span className="text-[#f87171] text-[11px] font-medium leading-normal animate-error-fade kyc-error-text mt-0.5">
                {errors.phone}
              </span>
            )}
          </div>

          {/* Field 3: Identity Document Type */}
          <div className="flex flex-col gap-1.5 text-left">
            <label style={{ color: 'var(--text-muted)' }} className="text-[11px] uppercase tracking-wider font-bold">Identity Document Type *</label>
            <select 
              value={idType}
              onChange={(e) => setIdType(e.target.value)}
              style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text-primary)' }}
              className="w-full border rounded-lg p-2.5 text-xs focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="National ID Card">National ID Card</option>
              <option value="Driver's Licence">Driver's Licence</option>
              <option value="Voter's Card">Voter's Card</option>
              <option value="International Passport">International Passport</option>
              <option value="Residence Permit">Residence Permit</option>
            </select>
          </div>

          {/* Field 4: ID Document Upload (REQUIRES FILE STORAGE API — currently stores filename only in localStorage) */}
          <div className="flex flex-col gap-1.5 text-left">
            <label style={{ color: 'var(--text-muted)' }} className="text-[11px] uppercase tracking-wider font-bold">
              Upload your {idType} *
            </label>
            <div className="relative">
              <input 
                type="file" 
                id="modal-kyc-raw-upload"
                className="hidden" 
                accept=".jpg,.jpeg,.png,.pdf"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    processFile(e.target.files[0]);
                  }
                }}
              />
              <div 
                onClick={() => document.getElementById('modal-kyc-raw-upload')?.click()}
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                style={{ 
                  borderColor: dragActive ? 'var(--emerald)' : 'var(--border)', 
                  backgroundColor: dragActive ? 'rgba(16,185,129,0.05)' : 'var(--surface2)' 
                }}
                className="w-full border-2 border-dashed rounded-xl p-5 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all text-center hover:bg-zinc-800/20"
              >
                <UploadCloud style={{ color: 'var(--text-muted)' }} className="w-6 h-6" />
                <span className="text-xs font-semibold font-sans" style={{ color: 'var(--text-primary)' }}>
                  {uploadedFileName ? (
                    <span className="flex items-center gap-1.5 text-emerald-400 font-mono">
                      Attached: {uploadedFileName}
                      <button 
                        type="button" 
                        onClick={removeUploadedFile}
                        className="p-0.5 rounded-full hover:bg-zinc-800 text-red-400 transition-all ml-1.2"
                        title="Remove attached file"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  ) : 'Click to select identity document or drag & drop'}
                </span>
                <span style={{ color: 'var(--text-dim)' }} className="text-[10px]">
                  PDF, JPG, or PNG. Maximum file constraint 5MB.
                </span>
              </div>
            </div>
            {showFieldError('uploadedFile') && (
              <span className="text-[#f87171] text-[11px] font-medium leading-normal animate-error-fade kyc-error-text mt-0.5">
                {errors.uploadedFile}
              </span>
            )}
          </div>

          {/* Field 5: Date of Birth */}
          <div className="flex flex-col gap-1.5 text-left">
            <label style={{ color: 'var(--text-muted)' }} className="text-[11px] uppercase tracking-wider font-bold">Date of Birth *</label>
            <input 
              type="date" 
              required
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
              onBlur={() => handleBlur('dob')}
              style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text-primary)' }}
              className="w-full border rounded-lg p-2.5 text-xs focus:outline-none focus:border-emerald-500 font-mono"
            />
            {showFieldError('dob') && (
              <span className="text-[#f87171] text-[11px] font-medium leading-normal animate-error-fade kyc-error-text mt-0.5">
                {errors.dob}
              </span>
            )}
          </div>

          {/* Field 6: Business or Trading Name */}
          <div className="flex flex-col gap-1.5 text-left">
            <label style={{ color: 'var(--text-muted)' }} className="text-[11px] uppercase tracking-wider font-bold">Business or Trading Name (optional)</label>
            <input 
              type="text" 
              maxLength={100}
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value.replace(/[^a-zA-Z0-9\s-]/g, ''))}
              placeholder="e.g. VoltKicks NG, Amara Styles"
              style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text-primary)' }}
              className="w-full border rounded-lg p-2.5 text-xs focus:outline-none focus:border-emerald-500 font-medium placeholder-zinc-500"
            />
          </div>

          {/* Location details section splits */}
          <div className="border-t border-dashed border-zinc-800 pt-3.5 flex flex-col gap-4">
            <h3 style={{ color: 'var(--text-muted)' }} className="text-[10px] font-bold uppercase tracking-widest text-left">Residence Address Details</h3>

            {/* Field 7: Country of Residence Searchable Selector */}
            <div ref={countryRef} className="flex flex-col gap-1.5 text-left relative">
              <label style={{ color: 'var(--text-muted)' }} className="text-[11px] uppercase tracking-wider font-bold">Country of Residence *</label>
              <input 
                type="text"
                value={isCountryDropdownOpen ? countryQuery : country}
                onChange={(e) => setCountryQuery(e.target.value)}
                onFocus={() => {
                  setIsCountryDropdownOpen(true);
                  setCountryQuery('');
                }}
                placeholder="Search and select your country..."
                style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text-primary)' }}
                className="w-full border rounded-lg p-2.5 text-xs focus:outline-none focus:border-emerald-500 font-medium placeholder-zinc-500"
              />
              {isCountryDropdownOpen && (
                <div 
                  style={{ 
                    backgroundColor: theme === 'light' ? '#ffffff' : '#1a1a1c', 
                    borderColor: 'var(--border)', 
                    boxShadow: '0 4px 16px rgba(0,0,0,0.3)' 
                  }} 
                  className="absolute left-0 right-0 top-full mt-1.5 max-h-48 overflow-y-auto border rounded-xl z-50 py-1"
                >
                  {filteredResidenceCountries.map(c => (
                    <div
                      key={c.name}
                      onClick={() => {
                        setCountry(c.name);
                        setIsCountryDropdownOpen(false);
                        setCountryQuery('');
                        
                        // Set state region defaults automatically based on chosen core items
                        if (c.name === 'Nigeria') setStateOfResidence('Lagos');
                        else if (c.name === 'United States') setStateOfResidence('California');
                        else if (c.name === 'United Kingdom') setStateOfResidence('England');
                        else if (c.name === 'Canada') setStateOfResidence('Ontario');
                        else setStateOfResidence('');
                      }}
                      style={{ color: 'var(--text-primary)' }}
                      className="px-3.5 py-2 hover:bg-emerald-500 hover:text-black cursor-pointer text-xs transition-colors flex items-center gap-2 text-left"
                    >
                      <span>{c.flag}</span>
                      <span>{c.name}</span>
                    </div>
                  ))}
                  {filteredResidenceCountries.length === 0 && (
                    <div className="px-3.5 py-2 text-xs text-zinc-500 italic text-left">No countries matching filter</div>
                  )}
                </div>
              )}
            </div>

            {/* Field 8: State or Region (Required only if NG, US, UK, Canada - otherwise free text) */}
            <div className="flex flex-col gap-1.5 text-left">
              <label style={{ color: 'var(--text-muted)' }} className="text-[11px] uppercase tracking-wider font-bold">
                State or Region {['Nigeria', 'United States', 'United Kingdom', 'Canada'].includes(country) ? '*' : '(optional)'}
              </label>

              {country === 'Nigeria' && (
                <select 
                  value={stateOfResidence}
                  onChange={(e) => setStateOfResidence(e.target.value)}
                  style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text-primary)' }}
                  className="w-full border rounded-lg p-2.5 text-xs focus:outline-none focus:border-emerald-500 cursor-pointer"
                >
                  {NIGERIAN_STATES.map((st) => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </select>
              )}

              {country === 'United States' && (
                <select 
                  value={stateOfResidence}
                  onChange={(e) => setStateOfResidence(e.target.value)}
                  style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text-primary)' }}
                  className="w-full border rounded-lg p-2.5 text-xs focus:outline-none focus:border-emerald-500 cursor-pointer"
                >
                  {US_STATES.map((st) => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </select>
              )}

              {country === 'United Kingdom' && (
                <select 
                  value={stateOfResidence}
                  onChange={(e) => setStateOfResidence(e.target.value)}
                  style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text-primary)' }}
                  className="w-full border rounded-lg p-2.5 text-xs focus:outline-none focus:border-emerald-500 cursor-pointer"
                >
                  {UK_COUNTRIES.map((ct) => (
                    <option key={ct} value={ct}>{ct}</option>
                  ))}
                </select>
              )}

              {country === 'Canada' && (
                <select 
                  value={stateOfResidence}
                  onChange={(e) => setStateOfResidence(e.target.value)}
                  style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text-primary)' }}
                  className="w-full border rounded-lg p-2.5 text-xs focus:outline-none focus:border-emerald-500 cursor-pointer"
                >
                  {CANADA_PROVINCES.map((pr) => (
                    <option key={pr} value={pr}>{pr}</option>
                  ))}
                </select>
              )}

              {!['Nigeria', 'United States', 'United Kingdom', 'Canada'].includes(country) && (
                <input 
                  type="text" 
                  value={stateOfResidence}
                  onChange={(e) => setStateOfResidence(e.target.value)}
                  placeholder="Enter your state or region"
                  style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text-primary)' }}
                  className="w-full border rounded-lg p-2.5 text-xs focus:outline-none focus:border-emerald-500 font-medium placeholder-zinc-500"
                />
              )}
              {showFieldError('state') && (
                <span className="text-[#f87171] text-[11px] font-medium leading-normal animate-error-fade kyc-error-text mt-0.5">
                  {errors.state}
                </span>
              )}
            </div>

            {/* Field 9: City (Required. Text input minimum 2 characters letters only) */}
            <div className="flex flex-col gap-1.5 text-left">
              <label style={{ color: 'var(--text-muted)' }} className="text-[11px] uppercase tracking-wider font-bold">City *</label>
              <input 
                type="text" 
                required
                value={city}
                onChange={(e) => setCity(e.target.value.replace(/[^a-zA-Z\s-]/g, ''))}
                onBlur={() => handleBlur('city')}
                placeholder="Enter your city"
                style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text-primary)' }}
                className="w-full border rounded-lg p-2.5 text-xs focus:outline-none focus:border-emerald-500 font-medium placeholder-zinc-500"
              />
              {showFieldError('city') && (
                <span className="text-[#f87171] text-[11px] font-medium leading-normal animate-error-fade kyc-error-text mt-0.5">
                  {errors.city}
                </span>
              )}
            </div>

            {/* Field 10: Street Address (Optional) */}
            <div className="flex flex-col gap-1.5 text-left">
              <label style={{ color: 'var(--text-muted)' }} className="text-[11px] uppercase tracking-wider font-bold">Street address (optional)</label>
              <input 
                type="text" 
                value={streetAddress}
                onChange={(e) => setStreetAddress(e.target.value.replace(/[^a-zA-Z0-9\s,-]/g, ''))}
                placeholder="Enter your street address"
                style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text-primary)' }}
                className="w-full border rounded-lg p-2.5 text-xs focus:outline-none focus:border-emerald-500 font-medium placeholder-zinc-500"
              />
            </div>
          </div>

          {/* Footer Control CTA */}
          <div 
            style={{ borderColor: 'var(--border)' }} 
            className="flex items-center gap-3 pt-5 border-t mt-3 bg-zinc-950/5"
          >
            <button 
              type="button" 
              onClick={onClose}
              disabled={isLoading}
              style={{ borderColor: 'var(--border)' }}
              className="flex-1 py-2.5 bg-transparent hover:bg-zinc-800/30 text-zinc-400 hover:text-white border rounded-lg text-xs font-bold uppercase transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={isLoading || isSubmitDisabled}
              className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-500/40 disabled:text-zinc-650 disabled:cursor-not-allowed text-black rounded-lg text-xs font-bold uppercase tracking-wide transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <span>Submit for Verification</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
