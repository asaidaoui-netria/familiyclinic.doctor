# Translation fidelity review: B01–B09, C00–C07

Scope: English and Arabic against normalized French source, including titles, summaries, and every reviewed body block. No medical fact-checking. Block indices are zero-based; item indices are zero-based unless stated otherwise. Production files unchanged.

## Coverage

Review complete: every title, summary, and body block in all 17 assigned articles was read in French, English, and Arabic. List items, table cells, and figure alt/caption text were included where present. Coverage totals 1,432 aligned body-block positions, comparing 2,864 translated blocks with French (4,296 blocks read including French).

- B01: title, summaries, blocks 0–113 complete in both English and Arabic; all list items and table cells read. No substantive semantic defect identified. Summaries are editorially rewritten but consistent with the body.
- B02: title, summaries, blocks 0–80 complete in both English and Arabic; all list items read. No substantive semantic defect identified. English title shortens “Comprendre et agir” to “Understanding”; considered a minor editorial title condensation, not a medical meaning defect. Summaries are editorially rewritten but consistent with the body.
- B03: title, summaries, blocks 0–68 complete in both English and Arabic; all list items read. No substantive semantic defect identified. English title is editorially retitled (“Understanding Hashimoto’s thyroiditis” versus “Hashimoto : Transformer l’assiette en soin quotidien”); the original practical-food emphasis remains in the summary/body. Summaries are editorially rewritten but consistent with the body.
- B04: title, summaries, blocks 0–140 complete in both English and Arabic; all list items and table cells read. One recurring low-severity Arabic progression/stage distinction below; no other substantive semantic defect identified.
- B05: title, summaries, blocks 0–126 complete in both English and Arabic; all list items read, including diagnostic and frequency lists. No substantive semantic defect identified. English title and both summaries are editorial condensations.
- B06: title, summaries, blocks 0–80 complete in both English and Arabic; all list items read. No substantive semantic defect identified. English title and both summaries are editorial condensations.
- B07: title, summaries, blocks 0–83 complete in both English and Arabic; all list items and table cells read. One medium-severity Arabic negation reversal appears twice (blocks 38 and 56). No other substantive semantic defect identified.
- B08: title, summaries, blocks 0–93 complete in both English and Arabic; all list items read. Low-severity Arabic progression/stage wording below; treatment caveats, medical supervision, limited evidence, and vitamin D/hypercalcemia caution all retained.
- B09: title, summary, and blocks 0–129 reviewed in FR/EN/AR, including all lists and tables. No substantive translation defects identified.
- C00: title, summary, and blocks 0–41 reviewed in FR/EN/AR, including all lists. No substantive translation defects identified.
- C01: title, summary, and blocks 0–86 reviewed in FR/EN/AR, including all lists. No substantive translation defects identified; EN title is an editorial retitle.
- C02: title, summary, and blocks 0–89 reviewed in FR/EN/AR, including all lists. No substantive translation defects identified; EN title is an editorial retitle.
- C03: title, summary, and blocks 0–61 reviewed in FR/EN/AR, including all lists. No substantive translation defects identified; EN title is an editorial retitle.
- C04: title, summary, and blocks 0–84 reviewed in FR/EN/AR, including all list items and figure alt/caption. Low Arabic age-of-onset terminology issue at block 49 item 0; all reported cohort figures and conditional-remission wording retained.
- C05: title, summary, and blocks 0–57 reviewed in FR/EN/AR, including all lists. No substantive translation defects identified.
- C06: title, summary, and blocks 0–46 reviewed in FR/EN/AR, including all lists. No substantive translation defects identified.
- C07: title, summary, and blocks 0–39 reviewed in FR/EN/AR, including all lists. No substantive translation defects identified; numeric thresholds, units, drug lists, and conditional claims preserved.
- Unreviewed: none within the assigned normalized JSON translation scope.

## Findings

### F1 — B04, Arabic, block 4: progressive fibrosis becomes advanced fibrosis (low)

- Source: “entraînant une inflammation chronique, une fibrose progressive et, à terme, une cirrhose.”
- Translation: “مما يسبب التهابًا مزمنًا وتليفًا متقدمًا، ثم تشمعًا في النهاية.”
- Meaning: “fibrose progressive” describes fibrosis developing/progressing over time; “تليفًا متقدمًا” describes advanced-stage fibrosis. The translation changes the stage of liver disease being described.
- Recommendation: use “تليفًا تدريجيًا” (or “تليفًا يتفاقم تدريجيًا”) to preserve progression rather than advanced severity.
- Same defect repeated in block 26, list item 4: French “foyers de nécrose plus ou moins étendue, fibrose progressive.” → Arabic “وبؤر نخر متفاوتة الاتساع، وتليفًا متقدمًا.”


- Related B04 Arabic block 74: French “une maladie chronique, progressive et potentiellement mortelle.” → Arabic “مرض مزمن ومتقدم وقد يكون مميتًا.” Again “progressive” becomes “advanced”; use “يتفاقم تدريجيًا” or an equivalent description of progression.

- Related B04 Arabic block 125: French “une invalidité progressive” → Arabic “عجز متقدم”. Again progressive disability becomes advanced disability; use “عجز يتفاقم تدريجيًا”.

### F2 — B07, Arabic, block 38: one nonresponder becomes only one responder (medium)

- Source: “Douze ont vu leurs douleurs s’apaiser franchement, deux ont connu une amélioration partielle, et un seul est resté insensible.”
- Translation: “شهد اثنا عشر هدوءًا واضحًا لآلامهم، وشهد اثنان تحسنًا جزئيًا، ولم يستجب سوى واحد.”
- Meaning: “لم يستجب سوى واحد” means “only one responded,” reversing the French statement that only one remained unresponsive. It also contradicts the preceding 12 clear plus 2 partial responders in the same sentence.
- Recommendation: replace the final clause with “وبقي مريض واحد فقط دون استجابة” or equivalent to retain 14 responders and one nonresponder out of 15.

- Same F2 defect repeats in B07 Arabic block 56: French “douze ont retrouvé une mobilité, deux ont vu leurs douleurs diminuer, un seul est resté insensible.” → Arabic “استعاد اثنا عشر الحركة، وتراجعت آلام اثنين، ولم يستجب سوى واحد.” Apply the same correction to the final clause.

### F3 — B08, Arabic, block 18: progressive pulmonary fibrosis becomes advanced fibrosis (low)

- Source: “Cette atteinte pulmonaire se traduit par une toux chronique, un essoufflement et parfois une fibrose progressive.”
- Translation: “وتظهر هذه الإصابة الرئوية بسعال مزمن وضيق نفس، وأحيانًا بتليف متقدم.”
- Meaning: same progression/stage confusion as F1. “بتليف متقدم” says advanced fibrosis; source describes progressive fibrosis.
- Recommendation: “وأحيانًا بتليف يتفاقم تدريجيًا” or equivalent.

- Related F3 issue in B08 Arabic block 25, item 1: French “Dans les formes évolutives, une fibrose pulmonaire peut apparaître” → Arabic “وقد يظهر تليف رئوي في الأشكال المتقدمة”. “Progressive forms” becomes “advanced forms”; use wording denoting progression, not necessarily an advanced stage.

### Terminology refinement — B08 Arabic, blocks 3, 58, 59, 73, 89 (low; ambiguity)

- French “naturopathie” is repeatedly rendered “العلاج الطبيعي”, including the block 58 heading “Naturopathie et micronutrition” → “العلاج الطبيعي والتغذية الدقيقة”.
- “العلاج الطبيعي” ordinarily also denotes physiotherapy, which is a different discipline. The surrounding herbal/supplement examples help disambiguate, so this is a terminology clarity concern rather than an omission or efficacy reversal.
- Recommendation: use a specific term for naturopathy, e.g. “طب الطبيعة (Naturopathie)”, consistently.

### F4 — C04, Arabic, block 49 item 0: adulthood rendered as puberty age (low)

- FR: “Apparition à l’âge adulte : le seuil de tolérance est dépassé après des années d’exposition alimentaire et environnementale.”
- AR: “الظهور في سن البلوغ: تُتجاوز عتبة التحمل بعد سنوات من التعرض الغذائي والبيئي.”
- Meaning: “سن البلوغ” ordinarily denotes puberty, while “l’âge adulte” denotes adulthood. This can move the stated onset to adolescence. The earlier prevalence paragraph correctly refers to adults and ages 20–40; the issue is confined to this list label.
- Recommendation: use “الظهور لدى البالغين” or “الظهور في مرحلة الرشد” to preserve the source age category.

## Result and boundaries

- Four finding groups: one medium-severity Arabic negation reversal in two passages (B07); three low-severity Arabic wording groups (B04, B08, C04). One additional low-severity naturopathy/physiotherapy ambiguity is listed separately.
- No substantive English translation defect identified in the assigned articles. Editorially rewritten summaries and shortened/retitled headings are not presented as literal translations, but are consistent with the article bodies; they were distinguished from body omissions.
- This review compares normalized French JSON with English/Arabic JSON. It does not verify raw Word/PDF extraction, source layout, page rendering, or text embedded inside figure images. The root audit owns original-source and rendered-output checks. It does not assess the scientific validity of the author's medical claims.
- All reported locations and quotes were reread against current JSON after completing the coverage pass. No production content was edited.
