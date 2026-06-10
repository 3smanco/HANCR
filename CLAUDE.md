## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
- Auto-update: a `Stop` hook in `.claude/settings.json` runs `graphify update .` in the background after every turn (lock-guarded, never blocks). No need to run it manually.

---

## ابدأ من هنا (Start here — يوفّر التوكن)

**اقرأ `.claude/STATE.md` أولاً في أي محادثة جديدة.** يحوي حالة المشروع الحالية (آخر إنجاز، التالي، المعمارية، أوامر التحقق، نمط العمل) في صفحة واحدة — يُغني عن تحميل مهارة HANCR الضخمة أو قراءة عشرات الملفات.

تفاصيل المنتج/التصميم الكاملة في مهارة `anthropic-skills:hancr` — استدعِها فقط عند الحاجة لقرار منتج أو تصميم، لا لكل مهمة.

## توفير التوكن (مهم — التزِم به)

1. **graphify قبل القراءة:** للأسئلة عن الكود استخدم `graphify query/explain/path` (يرجع subgraph صغير) بدل `grep`/قراءة ملفات كاملة. للملاحة استخدم `graphify-out/wiki/index.md`.
2. **قراءة موجَّهة:** اقرأ بـ `offset/limit` الجزء المطلوب فقط، لا الملف كله. لا تُعِد قراءة ملف عدّلته للتو (الأداة تتعقّب الحالة).
3. **لا تُعِد اكتشاف المعروف:** المعمارية وأوامر التحقق في `STATE.md` — لا تستكشفها من جديد كل مرة.
4. **لا تحمّل المهارة الضخمة بلا داعٍ:** مهارة HANCR + مراجعها كبيرة؛ `STATE.md` يكفي لاستئناف العمل.
5. **ردود مركّزة:** نفّذ بدل سرد الخيارات؛ لا تكرّر ما حُسم.
6. **اختبارات مُجمَّعة:** لا تشغّل `flutter analyze` مراراً؛ شغّله مرة بعد إنهاء التعديلات (ولا تشغّل تطبيقين معاً — تتعطّل الأداة).

## بعد كل خطوة (إلزامي)

بعد إنهاء كل خطوة عمل (ميزة/إصلاح/PR)، **حدّث `.claude/STATE.md`**: آخر إنجاز + الخطوة التالية + أي قرار/أمر جديد. هذا هو "الملخص لبدء محادثة جديدة" — يبقى المشروع قابلاً للاستئناف بأقل توكن.
