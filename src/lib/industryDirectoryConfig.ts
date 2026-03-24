import { Building2, Users, Camera, Film, Megaphone, GraduationCap, Wrench, MapPin, Clapperboard, Palette, Volume2, Lightbulb, Monitor, Truck, UtensilsCrossed, Shield, BookOpen, Laptop, UserCheck, Award, Briefcase, Plane, HardHat, Crosshair, Eye, Pen, Music, Hammer, Shirt, Car, HeartPulse, Rocket, Handshake, Warehouse, Languages, FileVideo } from 'lucide-react';

// === Directory Types ===
export interface DirectoryTypeStyle {
  label: string;
  icon: typeof Building2;
  color: string;
  bg: string;
  border: string;
  gradient: string;
}

export const directoryTypes: Record<string, DirectoryTypeStyle> = {
  company: {
    label: 'Production Companies',
    icon: Clapperboard,
    color: 'text-blue-400',
    bg: 'bg-blue-500/10 border-blue-500/20',
    border: 'border-blue-500/30',
    gradient: 'from-blue-600 to-cyan-600',
  },
  crew: {
    label: 'Crew',
    icon: Users,
    color: 'text-green-400',
    bg: 'bg-green-500/10 border-green-500/20',
    border: 'border-green-500/30',
    gradient: 'from-green-600 to-emerald-600',
  },
  service: {
    label: 'Services',
    icon: Wrench,
    color: 'text-purple-400',
    bg: 'bg-purple-500/10 border-purple-500/20',
    border: 'border-purple-500/30',
    gradient: 'from-purple-600 to-violet-600',
  },
  training: {
    label: 'Training & Education',
    icon: GraduationCap,
    color: 'text-amber-400',
    bg: 'bg-amber-500/10 border-amber-500/20',
    border: 'border-amber-500/30',
    gradient: 'from-amber-600 to-orange-600',
  },
  agency: {
    label: 'Agencies',
    icon: Briefcase,
    color: 'text-pink-400',
    bg: 'bg-pink-500/10 border-pink-500/20',
    border: 'border-pink-500/30',
    gradient: 'from-pink-600 to-rose-600',
  },
};

// === Categories per directory type ===
export interface CategoryOption {
  value: string;
  label: string;
  icon: typeof Building2;
}

export const categoryOptions: Record<string, CategoryOption[]> = {
  company: [
    { value: 'Fiction', label: 'Fiction', icon: Film },
    { value: 'Documentary', label: 'Documentary', icon: Camera },
    { value: 'Animation', label: 'Animation', icon: Palette },
    { value: 'Commercial', label: 'Commercial / Advertising', icon: Megaphone },
    { value: 'Post-Production', label: 'Post-Production', icon: Monitor },
    { value: 'VFX & CGI', label: 'VFX & CGI', icon: Lightbulb },
    { value: 'Distribution', label: 'Distribution', icon: Megaphone },
    { value: 'Line Production', label: 'Line / Service Production', icon: Users },
    { value: 'Co-Production', label: 'Co-Production Company', icon: Handshake },
    { value: 'Studio / Facility', label: 'Studio / Facility', icon: Warehouse },
    { value: 'Music Library', label: 'Music Library / Licensing', icon: Music },
  ],
  crew: [
    { value: 'Director', label: 'Director', icon: Clapperboard },
    { value: 'Producer', label: 'Producer', icon: Building2 },
    { value: 'Cinematographer', label: 'Cinematographer / DOP', icon: Camera },
    { value: 'Editor', label: 'Editor', icon: Monitor },
    { value: 'Sound', label: 'Sound Design / Mixing', icon: Volume2 },
    { value: 'Production Design', label: 'Production Design', icon: Palette },
    { value: 'Writer', label: 'Screenwriter', icon: BookOpen },
    { value: 'Line Producer', label: 'Line Producer / PM', icon: Users },
    { value: 'AD', label: 'Assistant Director', icon: Users },
    { value: 'Gaffer', label: 'Gaffer / Grip / Electric', icon: Lightbulb },
    { value: 'Costume & Makeup', label: 'Costume & Makeup', icon: Palette },
    { value: 'Colorist', label: 'Colorist', icon: Palette },
    { value: 'VFX Artist', label: 'VFX Artist', icon: Monitor },
    { value: 'Composer', label: 'Composer / Music', icon: Volume2 },
    { value: 'Stunt Coordinator', label: 'Stunt Coordinator', icon: HardHat },
    { value: 'Drone Operator', label: 'Drone / Aerial Operator', icon: Plane },
    { value: 'DIT', label: 'DIT / Data Wrangler', icon: Monitor },
    { value: 'Location Manager', label: 'Location Manager', icon: MapPin },
    { value: 'Script Supervisor', label: 'Script Supervisor', icon: Eye },
    { value: 'Still Photographer', label: 'Stills / BTS Photographer', icon: Camera },
  ],
  service: [
    { value: 'Equipment Rental', label: 'Equipment Rental', icon: Camera },
    { value: 'Studio Space', label: 'Studio Space', icon: Building2 },
    { value: 'Location Services', label: 'Location Services', icon: MapPin },
    { value: 'Casting', label: 'Casting', icon: UserCheck },
    { value: 'Post-Production', label: 'Post-Production', icon: Monitor },
    { value: 'Color Grading', label: 'Color Grading', icon: Palette },
    { value: 'Sound Studio', label: 'Sound Studio', icon: Volume2 },
    { value: 'Legal & Compliance', label: 'Legal & Compliance', icon: Shield },
    { value: 'Insurance', label: 'Insurance', icon: Shield },
    { value: 'Catering', label: 'Catering', icon: UtensilsCrossed },
    { value: 'Transport & Logistics', label: 'Transport & Logistics', icon: Truck },
    { value: 'Permits & Fixers', label: 'Permits & Fixers', icon: Shield },
    { value: 'Set Construction', label: 'Set Construction', icon: Hammer },
    { value: 'Props & SFX', label: 'Props & SFX', icon: Lightbulb },
    { value: 'Wardrobe House', label: 'Wardrobe / Costume House', icon: Shirt },
    { value: 'Vehicle Rental', label: 'Vehicle / Picture Car Rental', icon: Car },
    { value: 'Aerial & Drone', label: 'Aerial / Drone Services', icon: Plane },
    { value: 'Extras Casting', label: 'Extras / Background Casting', icon: Users },
    { value: 'Medical', label: 'Medics on Set', icon: HeartPulse },
    { value: 'Accommodation', label: 'Accommodation / Basecamp', icon: Building2 },
    { value: 'Security', label: 'Security', icon: Shield },
    { value: 'Gear House', label: 'Gear House / Camera Rental', icon: Warehouse },
    { value: 'DCP & Deliverables', label: 'DCP & Mastering / Deliverables', icon: FileVideo },
    { value: 'Subtitling & Localization', label: 'Subtitling / Dubbing / Localization', icon: Languages },
  ],
  training: [
    { value: 'Film School', label: 'Film School', icon: GraduationCap },
    { value: 'Short Course', label: 'Short Course / Workshop', icon: BookOpen },
    { value: 'Online Program', label: 'Online Program', icon: Laptop },
    { value: 'Mentorship', label: 'Mentorship', icon: Users },
    { value: 'Masterclass', label: 'Masterclass', icon: Award },
    { value: 'Incubator', label: 'Incubator / Accelerator', icon: Rocket },
    { value: 'Residency', label: 'Residency', icon: Building2 },
  ],
  agency: [
    { value: 'Talent Agency', label: 'Talent / Acting Agency', icon: UserCheck },
    { value: 'Crew Agency', label: 'Crew / Booking Agency', icon: Users },
    { value: 'Literary Agency', label: 'Literary / Writer Agency', icon: Pen },
    { value: 'Modelling Agency', label: 'Modelling Agency', icon: UserCheck },
    { value: 'Voiceover Agency', label: 'Voiceover Agency', icon: Volume2 },
    { value: 'Music Agency', label: 'Music / Composer Agency', icon: Music },
    { value: 'Sales Agent', label: 'Sales Agent / Distribution', icon: Megaphone },
    { value: 'Co-Production Facilitator', label: 'Co-Production Facilitator', icon: Handshake },
  ],
};

// === Countries (African focus + international) ===
export const africanCountries = [
  'Algeria', 'Angola', 'Benin', 'Botswana', 'Burkina Faso', 'Burundi', 'Cameroon',
  'Cape Verde', 'Central African Republic', 'Chad', 'Comoros', 'Congo (DRC)',
  'Congo (Republic)', 'Côte d\'Ivoire', 'Djibouti', 'Egypt', 'Equatorial Guinea',
  'Eritrea', 'Eswatini', 'Ethiopia', 'Gabon', 'Gambia', 'Ghana', 'Guinea',
  'Guinea-Bissau', 'Kenya', 'Lesotho', 'Liberia', 'Libya', 'Madagascar', 'Malawi',
  'Mali', 'Mauritania', 'Mauritius', 'Morocco', 'Mozambique', 'Namibia', 'Niger',
  'Nigeria', 'Rwanda', 'São Tomé and Príncipe', 'Senegal', 'Seychelles',
  'Sierra Leone', 'Somalia', 'South Africa', 'South Sudan', 'Sudan', 'Tanzania',
  'Togo', 'Tunisia', 'Uganda', 'Zambia', 'Zimbabwe',
  // Diaspora / International
  'United Kingdom', 'United States', 'France', 'Germany', 'Canada', 'Netherlands',
  'Belgium', 'Portugal', 'Brazil', 'UAE', 'Other',
];

// === Helper functions ===
export function getDirectoryType(type?: string | null) {
  if (!type) return directoryTypes.company;
  return directoryTypes[type] || directoryTypes.company;
}

export function getCategoriesForType(type: string): CategoryOption[] {
  return categoryOptions[type] || [];
}

export function getAllCategories(): CategoryOption[] {
  return Object.values(categoryOptions).flat();
}
