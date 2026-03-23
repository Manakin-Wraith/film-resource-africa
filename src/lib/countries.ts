/** Country types and utilities for location pages */

export interface Country {
  id: string;
  name: string;
  slug: string;
  iso_code: string;
  region: string;
  film_industry_size: 'small' | 'medium' | 'large';
  annual_productions: number;
  major_studios: string[];
  notable_filmmakers: string[];
  intro_text: string;
  filming_permit_info: string;
  tax_incentives: string;
  created_at: string;
  updated_at: string;
}

export interface CountryFAQ {
  question: string;
  answer: string;
}

/** Convert ISO 3166-1 alpha-2 to flag emoji */
export function getFlagEmoji(countryCode: string): string {
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map((char) => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

/** Industry size label */
export function getIndustrySizeLabel(size: string): string {
  switch (size) {
    case 'large':
      return 'Major Film Industry';
    case 'medium':
      return 'Growing Film Industry';
    case 'small':
      return 'Emerging Film Industry';
    default:
      return 'Film Industry';
  }
}

/** Region color mapping */
export function getRegionColor(region: string): { text: string; bg: string; border: string } {
  switch (region) {
    case 'West Africa':
      return { text: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' };
    case 'East Africa':
      return { text: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/20' };
    case 'North Africa':
      return { text: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' };
    case 'Southern Africa':
      return { text: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20' };
    case 'Central Africa':
      return { text: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' };
    default:
      return { text: 'text-primary', bg: 'bg-primary/10', border: 'border-primary/20' };
  }
}

/** Generate country-specific FAQs */
export function getCountryFAQs(country: Country): CountryFAQ[] {
  return [
    {
      question: `How do I find film grants in ${country.name}?`,
      answer: `Film Resource Africa lists all available grants, funding opportunities, and fellowships relevant to filmmakers in ${country.name}. Browse the opportunities below filtered for ${country.name}, or visit our main directory and filter by country. We update listings daily as new opportunities become available.`,
    },
    {
      question: `What film festivals are held in ${country.name}?`,
      answer: `${country.name} hosts several film festivals throughout the year. Check our directory for the latest festival listings, submission deadlines, and entry requirements. We track both major international festivals and smaller regional events across ${country.name}.`,
    },
    {
      question: `Do I need a filming permit to shoot in ${country.name}?`,
      answer: country.filming_permit_info || `Filming permits in ${country.name} vary by location and project type. We recommend contacting the national film commission or local authorities for the most up-to-date permit requirements.`,
    },
    {
      question: `Are there tax incentives for film production in ${country.name}?`,
      answer: country.tax_incentives || `Tax incentive information for ${country.name} varies. Contact the national film commission or trade ministry for the latest incentive programs available to local and international productions.`,
    },
    {
      question: `How can I connect with filmmakers in ${country.name}?`,
      answer: `Film Resource Africa connects you with the ${country.name} filmmaking community. Browse our Industry Directory to find production companies, crew members, and services based in ${country.name}. You can also join our newsletter for weekly updates on opportunities and events.`,
    },
  ];
}

/** Keywords for auto-detecting countries from opportunity text */
export const COUNTRY_KEYWORDS: Record<string, string[]> = {
  nigeria: ['nigeria', 'nigerian', 'lagos', 'nollywood', 'abuja'],
  'south-africa': ['south africa', 'south african', 'cape town', 'johannesburg', 'durban', 'joburg'],
  kenya: ['kenya', 'kenyan', 'nairobi', 'mombasa'],
  ghana: ['ghana', 'ghanaian', 'accra', 'ghallywood', 'kumasi'],
  egypt: ['egypt', 'egyptian', 'cairo', 'alexandria'],
  morocco: ['morocco', 'moroccan', 'marrakech', 'casablanca', 'ouarzazate', 'rabat'],
  tanzania: ['tanzania', 'tanzanian', 'dar es salaam', 'zanzibar', 'dodoma'],
  ethiopia: ['ethiopia', 'ethiopian', 'addis ababa', 'addis'],
  uganda: ['uganda', 'ugandan', 'kampala'],
  rwanda: ['rwanda', 'rwandan', 'kigali'],
  senegal: ['senegal', 'senegalese', 'dakar'],
  cameroon: ['cameroon', 'cameroonian', 'yaoundé', 'douala'],
  tunisia: ['tunisia', 'tunisian', 'tunis', 'carthage'],
  zimbabwe: ['zimbabwe', 'zimbabwean', 'harare'],
  'burkina-faso': ['burkina faso', 'burkinabè', 'ouagadougou', 'fespaco'],
};
