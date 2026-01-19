## Agentic Shorts Assistant

Drop any YouTube video or channel link to instantly surface Shorts-ready ideas. The app pulls public transcripts, scores the most energetic 30–60 second moments, and generates:

- Clip timestamps optimised for 9:16 cuts
- Hooky titles, punchy descriptions, and emoji captions
- 5–7 hashtags tuned for reach

### Local development

```bash
npm install
npm run dev
```

Open `http://localhost:3000` and paste a YouTube URL to test.

### Build & production

```bash
npm run lint
npm run build
```

Deploy the output to Vercel with `vercel deploy --prod --yes --token $VERCEL_TOKEN --name agentic-b1ae270b`.
