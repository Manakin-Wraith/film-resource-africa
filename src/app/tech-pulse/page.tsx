import { Metadata } from 'next';
import TechPulseClient from './TechPulseClient';

export const metadata: Metadata = {
  title: 'Tech-Pulse — The signal in the noise',
  description:
    'Tech-Pulse is FRA’s weekly editorial podcast — long conversations with the people building, breaking and betting on the new studio economy. New tape every Sunday. Members get into the live room.',
  openGraph: {
    title: 'Tech-Pulse — A weekly editorial podcast from FRA',
    description:
      'Long conversations with the people building the new studio economy. New tape every Sunday, 18:00 WAT.',
    url: 'https://film-resource-africa.com/tech-pulse',
  },
};

export default function TechPulsePage() {
  return <TechPulseClient />;
}
