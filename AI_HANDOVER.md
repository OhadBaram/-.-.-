# CarouselAI - Project State & Handover

## 🏗️ Tech Stack
- **Framework:** Next.js 14 (App Router), React, TypeScript
- **Styling:** Tailwind CSS, Lucide React (Icons)
- **Database:** Prisma ORM, PostgreSQL, Multi-Tenant Workspace Architecture (\`tenantDb\`)
- **Authentication:** NextAuth.js (Magic Links / Google)
- **AI Integrations:** OpenRouter (Google Gemini 2.5 Flash) via \`src/lib/services/ai.service.ts\`
- **Web Scraping:** Jina Reader API via \`src/lib/services/scraper.service.ts\`
- **Canvas Engine:** Native HTML5 Canvas (Async drawing), JSZip, jsPDF

## 🚀 Key Features Implemented
1. **AI Generation Engine:** Generates JSON for 4-15 slides based on topic, audience, goal, and brand guidelines.
2. **AI Brand Learning (Onboarding):** Scrapes user's provided URLs, generates a "Brand Identity", saves it to the workspace DB, and automatically injects it into all future AI prompts.
3. **AI Memory (Anti-Repetition):** The system fetches the last 3 generated carousels (\`slidesData\` in DB) and injects them into the prompt so the AI acts as a marketer and *diversifies* the content.
4. **Slide Editor:** Per-slide text editing, font size, Y-position sliders, and a **Fake Door** "AI Generate Image (Pro)" button.
5. **AI Remix:** Users can rewrite a single slide using context-aware AI.
6. **20 Canvas Templates:** 
   - 12 Text/Color templates (minimal, bold, gradient, dark-luxury, etc.)
   - 8 Image-Based async templates (image-full-dark, image-circle-profile, image-split-bottom, image-polaroid, image-side, image-magazine, image-overlay, image-arch).
7. **Image Support:** Users can upload per-slide images which render asynchronously on the canvas templates.
8. **Exports:** Download as individual PNGs (ZIP) for Instagram, or as a continuous PDF for LinkedIn.
9. **Billing Limits:** Freemium (2/mo), Pro (25/mo), Premium (60/mo) enforced via \`src/lib/usage.ts\`.

## 📂 Architecture Notes
- \`src/components/CarouselRenderer.tsx\`: The main parent holding state (\`localSlides\`, \`template\`). Calls \`drawSlide\` (async) which routes to the template functions.
- \`src/lib/templates/drawers.ts\`: Contains 20 pure functions for drawing the templates on the Canvas API.
- \`src/components/SlideEditor.tsx\`: The dumb UI component for editing a single slide (Textarea, sliders, upload buttons).
- \`src/app/api/generate/route.ts\`: Core generation logic using \`ai.service.ts\` and \`scraper.service.ts\`.

## 🎯 Next Steps / Roadmap for Next Session
1. **Stripe Integration:** Connect actual payment gateways for the Pro/Premium plans since the UI and usage limits are already in place.
2. **AI Image Generation:** Replace the "Fake Door" alert in \`SlideEditor.tsx\` with actual API calls to OpenAI DALL-E 3 or Fal.ai (Flux) to auto-generate illustrations for the user.
3. **Advanced Analytics:** Show the user what templates perform best (requires connecting an IG Graph API eventually).
