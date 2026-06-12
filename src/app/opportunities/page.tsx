import { redirect } from 'next/navigation';

// /opportunities has no index — the browsable list is the homepage directory.
export default function OpportunitiesIndexPage() {
  redirect('/#directory');
}
