export interface RawNdaSignature {
  id: string;
  producer_id: string;
  action: 'signed' | 'withdrawn';
  signer_name: string;
  doc_version: string;
  created_at: string;
}
export interface NdaLogEvent {
  id: string;
  action: 'signed' | 'withdrawn';
  signerName: string;
  docVersion: string;
  at: string;
}
export type NdaStatus = 'signed' | 'withdrawn' | 'legacy' | 'none';
export interface NdaProducerEntry {
  producerId: string;
  producerName: string;
  company: string;
  status: NdaStatus;
  current: { signerName: string; at: string; version: string } | null;
  events: NdaLogEvent[];
}
export interface NdaProducerInput {
  id: string;
  name: string;
  company: string;
  ndaSigned: boolean;
}

/** Group signature events per producer (newest first), derive current status, and
 *  emit one entry per producer that has ANY NDA activity (>=1 event OR ndaSigned).
 *  Legacy = ndaSigned true with no audit events (old one-click toggle). */
export function toNdaEntries(sigs: RawNdaSignature[], producers: NdaProducerInput[]): NdaProducerEntry[] {
  const byProducer = new Map<string, NdaLogEvent[]>();
  for (const s of sigs) {
    const ev: NdaLogEvent = { id: s.id, action: s.action, signerName: s.signer_name, docVersion: s.doc_version, at: s.created_at };
    const list = byProducer.get(s.producer_id);
    if (list) list.push(ev);
    else byProducer.set(s.producer_id, [ev]);
  }
  for (const list of byProducer.values()) list.sort((a, b) => (a.at < b.at ? 1 : a.at > b.at ? -1 : 0)); // newest first

  const entries: NdaProducerEntry[] = [];
  for (const p of producers) {
    const events = byProducer.get(p.id) ?? [];
    let status: NdaStatus;
    let current: NdaProducerEntry['current'] = null;
    if (events.length > 0) {
      const latest = events[0];
      status = latest.action === 'signed' ? 'signed' : 'withdrawn';
      if (status === 'signed') current = { signerName: latest.signerName, at: latest.at, version: latest.docVersion };
    } else if (p.ndaSigned) {
      status = 'legacy';
    } else {
      status = 'none';
    }
    if (events.length > 0 || p.ndaSigned) {
      entries.push({ producerId: p.id, producerName: p.name, company: p.company, status, current, events });
    }
  }

  const rank = (s: NdaStatus) => (s === 'signed' || s === 'legacy' ? 0 : 1); // covered first, withdrawn last
  const lastAt = (e: NdaProducerEntry) => (e.events.length > 0 ? e.events[0].at : '');
  entries.sort((a, b) => {
    const r = rank(a.status) - rank(b.status);
    if (r !== 0) return r;
    if (lastAt(a) !== lastAt(b)) return lastAt(a) < lastAt(b) ? 1 : -1; // most recent activity first
    return a.producerName < b.producerName ? -1 : a.producerName > b.producerName ? 1 : 0;
  });
  return entries;
}
