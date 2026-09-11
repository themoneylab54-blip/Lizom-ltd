# getlizom.com — Lizom Pro Ltd

Corporate showcase website for **Lizom Pro Ltd**, a UK-registered direct-to-consumer brand (lingerie, clothing, cosmetics, accessories) shipping across Europe. The site presents the company, its range and its operating model; it does not sell online.

The site has two jobs: present the brand, and stand as evidence of a real, compliant business during bank and payment-provider KYC reviews. Every page carries the full company identification required by UK law (registered name, company number, place of registration, registered office, contact email).

- Plain HTML, CSS and JavaScript. **No build step, no framework, no dependencies.**
- Design: Resend × Mercury. Dark sections for brand and proof, light sections for catalogue, operations and legal. The page switches scheme as you scroll. Motion layer: word-by-word hero reveal, 3D product stage, animated dot grid and scan line, SVG order route with a travelling parcel, self-drawing operation illustrations, rotating border beams, decoding mono labels, pointer tilt on cards, reading progress bar, film grain on dark sections. Everything is static under `prefers-reduced-motion`.
- Fonts self-hosted (Space Grotesk for headings, Geist for text, Geist Mono for labels). No request to Google Fonts, no cookies, no analytics.
- Accessible (WCAG AA contrast, keyboard navigation, visible focus, reduced-motion support), responsive (375 / 768 / 1440), SEO-ready (unique titles and descriptions, Organization JSON-LD, sitemap, robots).

## Structure

```
.
├── index.html                  Home
├── about/index.html            About: story, operating model, standards
├── contact/index.html          Contact form (Web3Forms) + company details
├── legal/index.html            Legal notice (company information, hosting, IP, law)
├── privacy/index.html          Privacy policy (UK GDPR + EU GDPR, cookies section)
├── terms/index.html            Terms of sale (prices, delivery, 14-day returns, guarantees)
├── 404.html                    Not-found page
├── assets/
│   ├── css/styles.css          Design tokens, components, animations, reduced-motion, print
│   ├── js/main.js              Scheme switch, reveals, hero stage, order route, counters, menu, TOC
│   ├── js/contact.js           Contact form: validation, loading, success/error, Web3Forms
│   ├── fonts/*.woff2           Self-hosted fonts (latin subset)
│   └── img/                    Placeholder SVGs (labelled with expected sizes), OG image, logos
├── favicon.svg, favicon-32.png, apple-touch-icon.png, site.webmanifest
├── sitemap.xml, robots.txt
├── _headers                    Security headers for Cloudflare Pages (and Netlify)
├── netlify.toml                Netlify config (publish dir + headers)
├── vercel.json                 Vercel config (clean URLs + headers)
└── package.json                `npm run dev` only; nothing to install
```

## Run locally

Any static server works. Pages use absolute paths (`/assets/...`), so serve from the repository root.

```bash
npm run dev            # serves on http://localhost:3000
# or
python3 -m http.server 3000
```

## Before going live

Search the code for `{{` and replace each placeholder:

| Placeholder | Where | What to put |
|---|---|---|
| `{{COMPANY_NUMBER}}` | every page (footer, legal, contact, about, JSON-LD) | Companies House number |
| `{{WEB3FORMS_ACCESS_KEY}}` | `assets/js/contact.js`, first constant | Access key from web3forms.com, created with hello@getlizom.com |
| `{{HOSTING_PROVIDER}}` | `legal/index.html`, `privacy/index.html` | Vercel, Netlify or Cloudflare, as deployed |
| `{{NUMERO_TVA}}` | `legal/index.html` | VAT number. The row stays hidden until the placeholder is replaced |
| `{{EU_REPRESENTATIVE}}` | `privacy/index.html` | Name and address of the Article 27 GDPR representative, if appointed. Hidden until replaced |

```bash
grep -rn "{{" --include=*.html --include=*.js --include=*.json .
```

### Contact form (Web3Forms)

1. Go to https://web3forms.com and enter the address that should **receive** the messages: `themoneylab54@gmail.com`. Click the confirmation link in the email you get. No account, no password. The key only delivers to that address, so it is safe to publish in the JavaScript.
2. Copy the access key into `assets/js/contact.js`:
   ```js
   var WEB3FORMS_ACCESS_KEY = "paste-your-key-here";
   ```
3. Free plan: 250 submissions per month. The key is public by design; it can only deliver to the address it was created for. A honeypot field and client-side validation are already in place.

Until the key is set, the form shows an explicit error asking visitors to email hello@getlizom.com directly. Make sure the public address `hello@getlizom.com` exists (or forwards to your inbox): it is printed on every page and compliance reviewers do test it.

### Images

The 22 visuals in `assets/img/` are illustrated process scenes (WebP, exact display sizes): specification sheets, swatches, shelving, parcels, delivery routes, a fulfilment floor. They are generated, not photographed, and deliberately show the process rather than garments. To replace any of them with a photo, keep the file name and aspect ratio:

| File(s) | Size | Use |
|---|---|---|
| `hero-01.webp` … `hero-05.webp` | 800 × 1000 | Floating cards in the home hero (dark ground) |
| `process-01.webp` … `process-08.webp` | 800 × 1000 | The eight-step process grid |
| `cat-lingerie.webp`, `-alt.webp` | 1200 × 1400 | Lingerie category card and its hover image |
| `cat-clothing.webp`, `-alt.webp` | 1000 × 800 | Clothing category card |
| `cat-skincare.webp`, `-alt.webp` | 1000 × 800 | Skincare category card |
| `cat-accessories.webp`, `-alt.webp` | 1000 × 700 | Accessories banner card |
| `about-story.webp` | 1400 × 800 | About page: the fulfilment floor |
| `og-image.png` | 1200 × 630 | Social sharing image |
| `logo-192.png`, `logo-512.png` | 192 / 512 | Manifest and JSON-LD logo |

## Deploy

The site is static; push the repository and point the host at the root directory. Clean URLs work out of the box because each page lives in its own folder (`/about/index.html` → `/about/`).

**Vercel** (recommended)
1. vercel.com → Add New → Project → Import Git Repository → pick `themoneylab54-blip/Lizom-ltd` and the branch you want to deploy (`main` after merging, or `claude/elegant-babbage-ybihz8` to preview).
2. Framework preset: *Other*. Build command: empty. Output directory: `.` (root).
3. Deploy. `vercel.json` adds security headers and clean URLs.
4. Settings → Domains → add `getlizom.com` and `www.getlizom.com`, then create the DNS records Vercel shows (A record for the apex, CNAME for www).

**Netlify**
1. app.netlify.com → Add new site → Import from Git → pick the repository.
2. Build command: empty. Publish directory: `.`
3. Deploy. `netlify.toml` and `_headers` add the security headers.
4. Domain management → Add custom domain → follow the DNS instructions.

**Cloudflare Pages**
1. dash.cloudflare.com → Workers & Pages → Create → Pages → Connect to Git.
2. Framework preset: *None*. Build command: empty. Output directory: `/`.
3. Deploy. `_headers` is applied automatically.
4. Custom domains → add `getlizom.com` (instant if DNS is already on Cloudflare).

After the first deploy: verify `https://getlizom.com/sitemap.xml` and `robots.txt` load, submit the sitemap in Google Search Console, and send a test message through the contact form.

## Editing content

Header and footer are repeated verbatim in each HTML file (no templating), so a change to either must be made in all seven files. Company details appear in: footer (all pages), `legal/index.html`, `privacy/index.html`, `terms/index.html`, `contact/index.html`, `about/index.html`, and the JSON-LD block in each `<head>`.

There are no prices, buy buttons or store links: this is a showcase site. Product copy deliberately describes materials, formats and intended use only. Keep it that way: efficacy or health claims on cosmetics are the most common reason payment providers freeze accounts in this category.

## Security headers and CSP

The headers files set a strict Content-Security-Policy: scripts and styles only from this origin, network requests only to `api.web3forms.com`, no inline styles. The single inline script (adding the `js` class before first paint) is allowed by its SHA-256 hash. If you edit that one-line script in the `<head>`, recompute the hash:

```bash
printf '%s' 'document.documentElement.classList.add("js")' | openssl dgst -sha256 -binary | base64
```
