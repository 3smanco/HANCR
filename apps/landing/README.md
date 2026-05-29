# HANCR Landing Page

Static landing page لـ hancr.com.

## التشغيل المحلي
```bash
cd apps/landing
npm install
npm run dev
# http://localhost:4000
```

## النشر على Cloudflare Pages (مجاناً)
1. اذهب إلى dash.cloudflare.com → Workers & Pages → Create
2. Connect to Git → اختر repo HANCR
3. Build settings:
   - Build command: `cd apps/landing && npm install && npm run build`
   - Build output: `apps/landing/out`
4. Environment: Production
5. Custom domain: `hancr.com` + `www.hancr.com`

النتيجة: SSL + CDN عالمي + بدون تكلفة + auto-deploy عند كل push لـ main.

## النشر البديل
- Vercel: تماماً نفس الفكرة، اربط GitHub repo
- يستضاف ضمن docker-compose.prod كـ extra service (لو تريد كل شيء في مكان واحد)
