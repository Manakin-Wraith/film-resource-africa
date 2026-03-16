#!/bin/bash
export SUPABASE_URL="https://rcgynwcttgvqcnbyfhiz.supabase.co"
export SUPABASE_KEY="sb_publishable_DGjAbWbzmEo7yqEOibia0A_r9mWOu-W"

insert_opp() {
  local json="$1"
  local title=$(echo "$json" | python3 -c "import sys,json; print(json.load(sys.stdin)['title'])" 2>/dev/null)
  local http_code=$(curl -s -o /tmp/sb_resp.json -w "%{http_code}" \
    "${SUPABASE_URL}/rest/v1/opportunities" \
    -H "apikey: ${SUPABASE_KEY}" \
    -H "Authorization: Bearer ${SUPABASE_KEY}" \
    -H "Content-Type: application/json" \
    -H "Prefer: return=representation" \
    -d "$json")
  if [ "$http_code" = "201" ]; then
    echo "✓ INSERTED: $title"
    cat /tmp/sb_resp.json | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'  ID: {d[0][\"id\"]}')" 2>/dev/null
  else
    echo "✗ FAILED: $title (HTTP $http_code)"
    cat /tmp/sb_resp.json
    echo
  fi
}

echo "=== Inserting 2 new FRA opportunities (March 16, 2026) ==="
echo

# 1. MIP Africa / FAME Week Africa
insert_opp '{"title":"MIP AFRICA / FAME WEEK AFRICA (Cape Town)","What Is It?":"MIP Africa is the largest B2B content market on the African continent, held annually as part of FAME Week Africa (Film, Arts, Media and Entertainment) in Cape Town, South Africa. Organised by RX Global in partnership with Reed MIDEM (the company behind MIPCOM and MIP TV), MIP Africa brings together content buyers, commissioners, producers, distributors, and investors from across Africa and the world. The event features pre-scheduled one-to-one matchmaking meetings that guarantee face-to-face meetings with targeted buyers and commissioners. In 2026, FAME Week Africa welcomed Media Valley — Johannesburg'"'"'s flagship virtual production hub and the largest virtual production stage in the southern hemisphere — as its Official Innovation Partner, signalling the growing importance of production technology infrastructure in the African content ecosystem. MIP Africa functions as the African counterpart to MIPCOM (already in this guide) and provides a dedicated platform for African content to reach global buyers.","For Films or Series?":"All formats — feature films, television series, documentaries, animation, digital content, and formats. Focus on finished content sales, co-production partnerships, and content financing.","What Do You Get If Selected?":"Access to pre-scheduled one-to-one matchmaking with international and African broadcasters, OTT platforms, and distributors. Exhibition show floor access. Full conference programme covering industry trends, new business models, and content strategies. Networking events from morning until night. Visibility for your content to the largest gathering of African content buyers on the continent.","Cost":"Delegate registration fee applies. Various pass tiers available (Buyer, Producer, Delegate, Media). Contact fame@rxglobal.com for pricing.","Next Deadline":"MIP Africa 2026: 28-30 October 2026, Cape Town, South Africa. Registration open at register.fameweekafrica.com.","Apply:":"fameweekafrica.com/mip-africa","Who Can Apply / Eligibility":"Open to all content professionals — producers, distributors, broadcasters, OTT platforms, commissioners, and investors. Buyers and commissioners receive priority matchmaking. Producers and content creators can register as delegates.","What to Submit":"Delegate registration via the FAME Week Africa website. Content sellers should prepare screeners, sales decks, and project presentations for matchmaking meetings.","Strongest Submission Tips":"MIP Africa is where African content meets global distribution. If you have finished content to sell, this is the single most efficient market to meet African and international buyers in one place. If you are a producer seeking co-production partners or financing, MIP Africa puts you face-to-face with commissioners and investors. Combined with MIPCOM (October, Cannes) and the Durban FilmMart (July, Durban), MIP Africa completes the annual calendar of essential African content markets. The Media Valley partnership also signals new virtual production opportunities for African creators.","CALENDAR REMINDER:":"MIP Africa 2026: 28-30 October 2026, Cape Town. Register early at fameweekafrica.com.","status":"approved","votes":0}'

echo

# 2. Alter-Cine Foundation Documentary Grants
insert_opp '{"title":"ALTER-CINÉ FOUNDATION DOCUMENTARY GRANTS","What Is It?":"The Alter-Ciné Foundation was created in 2001 in memory of Canadian documentary filmmaker Yvan Patry, co-founder of the production company Alter-Ciné, who directed numerous documentaries and current affairs programmes in Africa, Latin America, and Asia. Each year, the Foundation awards grants to documentary filmmakers from the Global South — including Africa, Asia, and Latin America — as a contribution to the production of feature-length documentary projects. In 2026, the Foundation announced two additional grants in memory of Gian-Battista Bachetta, a passionate cinephile who spent 25 years working to assist victims of armed conflict. This brings the 2026 total to four grants. The Foundation prioritises documentaries told in indigenous languages and stories about rights and freedoms.","For Films or Series?":"Feature-length documentary only. Must be from the Global South (Africa, Asia, or Latin America).","What Do You Get If Selected?":"Grants of $10,000 CAD and $5,000 CAD toward documentary production. In 2026, two additional grants added (one at $10,000 CAD, one at $5,000 CAD) — four grants total this year.","Cost":"FREE — No application fee","Next Deadline":"Annual cycle. Check altercine.org for 2026 submission dates.","Apply:":"altercine.org/en/documentary-film-grants","Who Can Apply / Eligibility":"Documentary filmmakers from Africa, Asia, or Latin America. Feature-length documentary projects. Indigenous language documentaries are prioritised.","What to Submit":"Project submission via the Alter-Ciné Foundation website. Details at altercine.org.","Strongest Submission Tips":"The Alter-Ciné Foundation explicitly values documentaries about rights, freedoms, and stories told in indigenous languages — themes that align with many African filmmakers work. The grants are modest ($5K-$10K CAD) but can serve as seed funding or gap financing alongside larger grants from IDFA Bertha Fund, Hot Docs-Blue Ice, or Sundance Documentary Fund. The 2026 expansion to four grants doubles your chances of selection. African documentary filmmakers working in indigenous languages should strongly consider applying.","CALENDAR REMINDER:":"Check altercine.org for 2026 submission deadline. Four grants available this year.","status":"approved","votes":0}'

echo
echo "=== Done ==="
