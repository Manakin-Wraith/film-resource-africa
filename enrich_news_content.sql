-- FRA: Enrich all news articles with editorial content + add images
-- Run in Supabase SQL Editor: https://supabase.com/dashboard/project/rcgynwcttgvqcnbyfhiz/sql/new

-- ===== IMAGES FOR ARTICLES MISSING THEM =====

-- ID 2: Showmax Shutdown — no source URL, keep existing Unsplash image

-- ID 17: SAFTAs Winners — from bizcommunity.com article OG image
UPDATE news SET image_url = 'https://biz-file.com/c/2603/805970-1024x532.jpg?4' WHERE id = 17;

-- ID 18: Zenande Mfenyana Golden Horn — from iol.co.za article OG image
UPDATE news SET image_url = 'https://iol-prod.appspot.com/image/62e2203d1efce7647f36f1b244846897b262ee8b/1000/jpeg' WHERE id = 18;

-- ID 19: SAFTAs Nominees — tvsa.co.za has no OG image, use Unsplash film production fallback
UPDATE news SET image_url = 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=800&h=450&fit=crop&q=80' WHERE id = 19;

-- ID 20: Oscars Sinners — from euronews.com article OG image
UPDATE news SET image_url = 'https://images.euronews.com/articles/stories/09/68/66/04/1200x675_cmsv2_a757c3fb-9981-5fdc-8adf-d15993cf7507-9686604.jpg' WHERE id = 20;

-- ID 21: Oscars Full Winners — from screendaily.com article OG image
UPDATE news SET image_url = 'https://d1nslcd7m2225b.cloudfront.net/Pictures/1024x536/6/0/1/1474601_98_tl_0763_743310_crop.jpg' WHERE id = 21;

-- ===== ENRICHED EDITORIAL CONTENT =====

-- ID 3: AFAC Documentary Fund
UPDATE news SET content = 'The Arab Fund for Arts and Culture (AFAC) has opened applications for its Documentary Fund, with a deadline of 2 April 2026.

AFAC''s Documentary Fund supports feature-length documentary projects from the Arab world, including North African countries. The fund covers development, production, and post-production stages, making it one of the more comprehensive documentary funding sources available to filmmakers from the region.

Past recipients have gone on to screen at major festivals including Cannes, Berlin, and IDFA. The fund prioritises bold, creative approaches to documentary storytelling that engage with contemporary social and political realities.

For African documentary filmmakers — particularly those from North Africa or working on stories connected to the Arab world — this is a high-value opportunity. The application process requires a project treatment, director''s statement, and budget breakdown.

Key details: Applications close 2 April 2026. Check the FRA directory for the full listing and application link.' WHERE id = 3;

-- ID 4: Pro Tip - Three Markets Strategy
UPDATE news SET content = 'One of the most effective strategies for documentary filmmakers seeking international financing is what industry veterans call the "Three Markets" approach.

The strategy works like this: instead of relying on a single funder, you build your financing package across three distinct markets — typically your home territory, a European co-production partner, and an international broadcaster or streaming platform.

Why three? Because each market brings different things to the table. Your home territory provides cultural authenticity and local broadcast value. A European partner (through funds like Eurimages, CNC, or regional film funds) adds production budget and festival credibility. And an international broadcaster or platform provides the final piece plus global distribution.

This approach is especially powerful for African filmmakers because it mirrors how the most successful African films of recent years have been financed. Films like "Atlantics" (Senegal/France/Belgium), "Lingui" (Chad/France/Germany), and "Goodbye Julia" (Sudan/Saudi Arabia/Egypt) all used multi-territory financing.

Start by identifying which funds in the FRA directory match each of your three target markets, then build your package outward from the strongest confirmed support.' WHERE id = 4;

-- ID 5: Makemation Nigeria AI Film
UPDATE news SET content = 'Nigerian AI-generated feature film "Makemation" has grossed ₦32 million (approximately $20,000 USD) in just four days of theatrical release, marking a significant milestone for AI filmmaking on the African continent.

The film, created using generative AI tools, represents one of the first commercially released AI feature films in Africa. While the gross is modest by international standards, the speed of production and the audience response signal growing interest in AI as a filmmaking tool in Nigeria and across the continent.

The release has sparked debate within the Nigerian film industry about the role of AI in content creation. Supporters see it as a democratising force that could lower barriers to entry for emerging filmmakers. Critics worry about the impact on traditional craft roles and the quality of storytelling.

What this means for African creators: AI filmmaking tools are becoming commercially viable, not just experimental. Whether you embrace AI as a production tool or compete against it with traditional craft, understanding these tools is becoming essential. The economics of micro-budget AI filmmaking could be particularly relevant for emerging African filmmakers working with limited resources.' WHERE id = 5;

-- ID 6: Tunisian AI Film Award Dubai
UPDATE news SET content = 'Tunisian filmmaker Zoubeir Jlassi has won $1 million at the 1 Billion Followers Summit in Dubai for his short film "Lily," created entirely with Google Gemini AI — making it the world''s largest AI film prize to date.

Jlassi''s win is a milestone for African and Arab creators in the rapidly evolving AI filmmaking space. "Lily" was produced using Google''s generative AI tools, demonstrating that filmmakers from the Global South can compete at the highest levels of this emerging medium.

The 1 Billion Followers Summit, held in Dubai, has become a major platform for digital creators and content innovators. The $1 million prize makes this one of the most lucrative film awards globally — AI or otherwise.

For African filmmakers, this win opens important questions and opportunities. The prize money and global visibility demonstrate that international institutions are investing heavily in AI content creation. North African and Arab filmmakers may have a particular advantage given the cultural bridge between the African and Middle Eastern creative economies.

Key takeaway: AI filmmaking competitions represent a new funding pathway for African creators. Keep an eye on emerging festivals and competitions in this space — they offer prize money that rivals traditional film funds.' WHERE id = 6;

-- ID 9: Showmax Shutdown Confusion
UPDATE news SET content = 'Showmax subscribers received an unexpected email confirming the service would shut down, triggering confusion across the African film and television industry.

The announcement was poorly coordinated. Initial reports were contradictory — some outlets suggested a gradual wind-down while Canal+ appeared to confirm immediate discontinuation. Creators and distributors scrambled for clarity on what would happen to commissioned content, licensing deals, and ongoing productions.

Within hours, reactions poured in from across the industry. Producers with shows in development questioned whether their deals would be honoured. Content creators worried about residual payments. And viewers expressed frustration at losing access to a platform that had invested meaningfully in original African content.

Canal+ eventually issued a clarification, but the damage to industry confidence was done. The episode highlighted a broader concern: as Africa''s streaming landscape consolidates, creators have fewer negotiating positions and less leverage.

What this means for creators: Don''t rely on a single platform deal. Build financing packages from multiple international sources — co-production funds, regional broadcasters, and international sales agents. The opportunities in FRA''s directory are more relevant than ever for diversifying your funding strategy.' WHERE id = 9;

-- ID 10: Canal+ Shuts Down Showmax
UPDATE news SET content = 'Canal+ has confirmed it will discontinue Showmax after years of mounting losses on the platform. The move consolidates Canal+''s position as the dominant force in pan-African content commissioning.

Showmax launched in 2015 as MultiChoice''s answer to Netflix in Africa, eventually merging with Comcast''s technology stack in a 2023 joint venture. Despite significant investment in original African content — including hit series and Showmax Originals — the platform never achieved profitability.

For the African film and television industry, this is a watershed moment. The commissioning landscape is consolidating around fewer, bigger players. Canal+ now controls both its own channels and what was Showmax''s content pipeline.

The implications extend beyond South Africa. Showmax had been expanding across the continent, commissioning content in multiple African languages and markets. Its closure means fewer buyers for original African content at a time when the industry needs more, not fewer, platforms.

Key takeaway for creators: Independent financing is now more important than ever. Explore co-production funds, pitch forums, and international partnerships. Check the FRA directory for open opportunities that can help diversify your funding sources beyond any single platform.' WHERE id = 10;

-- ID 11: Ghana Akwaaba Magic
UPDATE news SET content = 'Ghana''s Akwaaba Magic channel is celebrating its 5th anniversary, marking half a decade of dedicated Ghanaian content on the MultiChoice platform.

Akwaaba Magic launched as DStv''s first dedicated Ghanaian entertainment channel, providing a platform for local storytelling that had previously been underserved by pan-African broadcasters. The channel has since become a significant commissioner of Ghanaian original content, from drama series to reality shows.

The 5th anniversary is significant in the context of Africa''s evolving broadcast landscape. While streaming platforms have grabbed headlines (and then sometimes disappeared, as with Showmax), traditional broadcast channels like Akwaaba Magic continue to provide steady commissioning opportunities for local creators.

For Ghanaian and West African filmmakers, Akwaaba Magic represents an important market for content — one that prioritises local language and culturally specific storytelling. The channel''s survival and growth over five years demonstrates that there is sustainable demand for African content that speaks directly to specific national audiences.

Worth noting: DStv/MultiChoice channels remain one of the most reliable commissioning routes for African content creators, even as the streaming landscape shifts.' WHERE id = 11;

-- ID 12: Joburg Film Festival
UPDATE news SET content = 'The 8th Joburg Film Festival kicked off with a programme that signals growing ambition for Johannesburg as an African film hub.

The festival''s opening day featured a mix of South African premieres, international selections, and an expanded industry platform designed to connect local filmmakers with international partners. The programme spans documentary, fiction, and experimental work from across the continent.

Notably, the industry platform has been restructured to include more structured networking sessions, pitch opportunities, and masterclasses focused on practical skills like international co-production and festival strategy.

The festival also increased its focus on emerging voices, with dedicated screening slots for debut filmmakers and student work. This reflects a broader trend across African film festivals toward talent development, not just exhibition.

For African filmmakers, JFF represents an important showcase and networking opportunity. The festival''s growing international profile makes it a valuable platform for projects seeking co-production partners or international distribution. South African creators in particular should watch for future call-for-entries announcements.' WHERE id = 12;

-- ID 13: Eagles of the Republic trailer
UPDATE news SET content = 'The trailer for "Eagles of the Republic," directed by Tarik Saleh (Cairo Conspiracy, The Nile Hilton Incident), has been released ahead of its U.S. theatrical premiere on April 17 via Cohen Media Group.

Saleh, who won the Best Screenplay award at Cannes 2022 for "Cairo Conspiracy" (Boy from Heaven), continues to establish himself as one of the most internationally visible filmmakers working across the African and Arab worlds. His films blend political thriller elements with sharp commentary on power structures.

Cohen Media Group''s acquisition and theatrical release demonstrates continued American appetite for films from African and Middle Eastern filmmakers — an important signal for creators seeking international distribution.

For African filmmakers: Tarik Saleh''s career trajectory offers a useful case study. He built international visibility through festival premieres (Sundance, Cannes), worked with European co-production funds, and now has a reliable U.S. distribution partner. This is the kind of strategic career building that the funds and labs in the FRA directory are designed to support.' WHERE id = 13;

-- ID 14: Janus Films acquires Dao
UPDATE news SET content = 'Janus Films — the legendary U.S. distribution company behind the Criterion Collection — has acquired U.S. rights to "Dao" following its world premiere in Competition at the 2026 Berlinale.

A Janus Films acquisition is one of the most prestigious distribution deals a film can secure. The company is known for championing cinema from around the world, and their involvement signals that "Dao" has been recognised as a work of significant artistic merit.

The Berlinale Competition premiere already placed the film in the highest tier of international festival recognition. The Janus deal ensures the film will reach U.S. audiences through theatrical release and eventually through the Criterion Collection''s streaming and physical media channels.

For African filmmakers, this is a reminder of the value of major festival premieres. A Competition slot at Berlin, Cannes, or Venice doesn''t just provide visibility — it directly leads to distribution deals with companies like Janus, MUBI, and Neon. The path to these premieres often starts with the development labs and co-production funds listed in the FRA directory.' WHERE id = 14;

-- ID 15: FESPACO 2027
UPDATE news SET content = 'FESPACO — the Pan-African Film and Television Festival of Ouagadougou — has announced dates for its landmark 30th edition in 2027, along with significant market reform plans.

The festival, held biennially in Burkina Faso, is the oldest and largest film festival on the African continent. The 30th edition marks a milestone that the organisers are treating as an opportunity to modernise the event''s market and industry components.

Key reforms being discussed include streamlined accreditation, a digital marketplace for African content, and stronger partnerships with international film markets. These changes aim to make FESPACO more relevant to the contemporary African film industry, where digital distribution and international co-production are increasingly important.

The market reforms are particularly noteworthy. FESPACO''s industry component has historically lagged behind its festival programming. A modernised market could create real business opportunities for African filmmakers, connecting them with international buyers, co-production partners, and distribution platforms.

For filmmakers: Mark your calendars. FESPACO remains the most important gathering for pan-African cinema, and the market reforms could create new opportunities for content deals and partnerships. Start planning submissions early — competition for screening slots is intense.' WHERE id = 15;

-- ID 16: Lagos Goes to Cannes
UPDATE news SET content = 'Lagos has been selected to join the prestigious "Goes to Cannes" programme for the 2026 Cannes Film Festival, facilitated through the Africa International Film Festival (AFRIFF).

The "Goes to Cannes" initiative connects emerging film cities and their creative communities with the world''s most influential film market. Lagos joins a select group of cities that receive dedicated programming, networking sessions, and market access at the Marché du Film.

This is a significant milestone for Nigeria''s film industry — and for Nollywood filmmakers seeking international co-production and distribution opportunities. The AFRIFF partnership means Lagos-based creators will have structured pathways to meet international sales agents, distributors, and co-production partners at Cannes.

The timing is significant. Nigeria''s film industry has been generating increasing international interest, with films like "Anikulapo" and "Gangs of Lagos" reaching global audiences through streaming platforms. The "Goes to Cannes" programme could help translate that visibility into co-production deals and festival premieres.

What to watch: Keep an eye on AFRIFF''s announcements for filmmaker delegations and submission opportunities. This could be a game-changer for Nigerian and West African creators looking to break into the international market through the Cannes ecosystem.' WHERE id = 16;
