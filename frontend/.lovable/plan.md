# Complete SEO Plan — Claim For Sure

Goal: rank for insurance-claim assistance and policy-buying queries in India, get every public page indexed cleanly, and make the site AI-crawler friendly. Below is what I'll build, in the order I'll build it.

## 1. Fix current SEO findings (from last scan)

- **Homepage title collision** — homepage currently reuses the root default. Give `src/routes/index.tsx` a distinct, keyword-rich `<title>` and shorten its meta description to 150–160 chars.
- **Long descriptions** — trim `/claim-help` (165 ch) and `/policies` (172 ch) descriptions under 160.
- **Missing Open Graph tags** — add `og:title` + `og:description` to `terms`, `refund`, and `auth.login`; leave `og:image` off unless the user provides one (placeholders hurt).
- **Canonical audit** — every leaf route already has one; I'll verify each new/old route self-references `https://connect-brite.lovable.app/<path>`.

## 2. Per-page metadata rewrite (title / description / OG)

Rewrite `head()` on every public route with a distinct, keyword-targeted pair. Examples:

- `/` — "Insurance Claim Help & Policy Buying in India | Claim For Sure"
- `/claim-help` — "Insurance Claim Assistance — Health, Motor, Life | Claim For Sure"
- `/policies` — "Compare & Buy Health, Motor, Term & Life Insurance Online"
- `/how-it-works` — "How Our Insurance Claim Assistance Works — Step by Step"
- `/faq` — "Insurance Claim FAQs — Rejection, Delay, Documents, Ombudsman"
- `/about` — "About Claim For Sure — Sidheswar Enterprises, Odisha"
- `/appreciation` — "Customer Appreciation Program — Claim For Sure"
- Legal pages (`/privacy`, `/terms`, `/refund`, `/disclaimer`, `/service-agreement`) — short, factual descriptions.

## 3. Structured data (JSON-LD)

Add schema.org markup so Google can build rich results:

- `__root.tsx` — `Organization` (name, logo, phone, address, sameAs) + `WebSite` with `SearchAction`.
- `/` — `Service` (already present, refine `areaServed`, `serviceType`, `offers`).
- `/faq` — `FAQPage` built from the FAQ list.
- `/how-it-works` — `HowTo` steps.
- `/about` — `AboutPage` linked to Organization.
- `/policies` — `ItemList` of insurance product categories.

## 4. Sitemap + robots

- Update `src/routes/sitemap[.]xml.ts` to include every public route: `/`, `/about`, `/how-it-works`, `/claim-help`, `/policies`, `/faq`, `/appreciation`, `/privacy`, `/terms`, `/refund`, `/disclaimer`, `/service-agreement`.
- Explicitly exclude auth, admin, `/forgot-password`, `/reset-password`, `/$` (splat 404).
- Set `<lastmod>`, per-route `<priority>` and `<changefreq>`.
- `public/robots.txt` — already good. I'll leave the disallow blocks and confirm the `Sitemap:` line.

## 5. AI-crawler readiness

Create `public/llms.txt` listing only public pages with one-line descriptions — helps ChatGPT / Perplexity / Claude summarize the site without JS-rendering.

## 6. Google Search Console

Use the connector to verify the domain and submit the sitemap:

1. Request a META verification token via the Search Console connector.
2. Inject the `google-site-verification` meta tag into `__root.tsx` head.
3. After you publish, run the `webResource` verify call, then `PUT sites/https%3A%2F%2Fconnect-brite.lovable.app%2F` so it appears in your GSC property list.
4. I'll trigger URL Inspection for the homepage as a smoke test.

## 7. Keyword targeting (based on your niche)

Primary intents I'll optimize for:

- Insurance claim assistance / help / rejected claim recovery
- Buy insurance online India (health, motor, term, life)
- Claim documentation guidance, ombudsman escalation
- POSP / advisor-assisted policy buying

I'll pull Semrush data on those before finalizing the on-page copy tweaks and offer a short keyword report.

## 8. Content & technical polish

- Ensure a single `<h1>` per route, keyword-led.
- Add descriptive `alt=` on all images (logo, hero art, icons that carry meaning).
- Internal links: every service page links to `/policies`, `/claim-help`, `/faq`, `/about`.
- Confirm `viewport`, `charSet`, and OG defaults in `__root.tsx`.
- Preserve non-fake trust content (we already removed the fabricated testimonials — good for E-E-A-T).

## 9. Verify & close

- Re-run the SEO scan; mark fixed findings closed.
- Show you URL Inspection results for `/` and `/policies`.
- Hand off a checklist of what to monitor in Search Console over 2–8 weeks (impressions, average position, coverage errors).

---

**Technical execution notes**

- All head changes go through TanStack `createFileRoute({ head })` — never inject via `<Helmet>` or client effects. `title` stays inside the `meta[]` array.
- `og:image` intentionally omitted per-route unless you upload/approve a hero image — placeholder images hurt ranking.
- Semrush queries will use the `in` database (India market) since the audience and phone numbers are Indian.
- Approve me to trigger `standard_connectors--connect` for the Google Search Console connector when we hit step 6; verification only works after you publish.

Reply "go" to execute steps 1–5 immediately, or tell me to reorder / skip parts.
