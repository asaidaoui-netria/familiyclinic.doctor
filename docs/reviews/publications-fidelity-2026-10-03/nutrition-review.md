# Nutrition translation fidelity audit

Completed: A00–A15 and D05–D06, all 18 assigned articles. All 1,346 body blocks were read in French, English and Arabic, including every list item and table cell, plus titles and summaries. Indices below are zero based.

Ten localized finding groups: nine Arabic and one minor English precision issue, spanning 12 locations (11 body passages plus one summary). Most consequential are A09's Arabic exclusion scope and A04's substituted vegetable. The remaining findings concern quantifiers, certainty, terms or a typo. Source medical claims are treated as supplied; this is not a medical fact check.

## Coverage

| Article | Body blocks read | Title, summary, all block contents |
|---|---|---|
| A00 | 0–46 | Complete in FR/EN/AR |
| A01 | 0–123 | Complete in FR/EN/AR |
| A02 | 0–59 | Complete in FR/EN/AR |
| A03 | 0–34 | Complete in FR/EN/AR |
| A04 | 0–161 | Complete in FR/EN/AR |
| A05 | 0–36 | Complete in FR/EN/AR |
| A06 | 0–67 | Complete in FR/EN/AR |
| A07 | 0–99 | Complete in FR/EN/AR |
| A08 | 0–64 | Complete in FR/EN/AR |
| A09 | 0–108 | Complete in FR/EN/AR |
| A10 | 0–121 | Complete in FR/EN/AR |
| A11 | 0–69 | Complete in FR/EN/AR |
| A12 | 0–75 | Complete in FR/EN/AR |
| A13 | 0–99 | Complete in FR/EN/AR |
| A14 | 0–64 | Complete in FR/EN/AR |
| A15 | 0–37 | Complete in FR/EN/AR |
| D05 | 0–38 | Complete in FR/EN/AR |
| D06 | 0–28 | Complete in FR/EN/AR |

## Findings

### N01 — A03 Arabic body weakens “almost always” (minor/moderate fidelity)

- `A03/ar.json`, block 20, paragraph: FR “l’abandon du régime entraîne **presque toujours** une rechute en quelques semaines ou quelques mois” → AR “التخلي عن النظام الغذائي يؤدي **في معظم الأحيان** إلى انتكاسة خلال أسابيع أو أشهر قليلة”. Arabic means “in most cases”, weaker than “almost always”.
- `A03/ar.json`, block 22, paragraph: FR “la réduction des déchets insolubles ou des molécules à éliminer produit **presque toujours** un effet favorable” → AR “يؤدي خفض الفضلات غير القابلة للذوبان أو الجزيئات الواجب إخراجها، **في معظم الأحيان**، إلى أثر إيجابي”. Same weakening of frequency in an efficacy assertion.
- Recommendation: preserve the source quantifier in each instance, e.g. “دائمًا تقريبًا”. English preserves “almost always” in both.

### N02 — A03 Arabic summary adds a skeptical editorial qualifier (minor; synopsis only)

- `A03/ar.json`, summary (no block index): FR “un outil thérapeutique majeur. Il agit à la racine des désordres” → AR synopsis “ودوره **المزعوم** في العلاج والوقاية” (“its **alleged** role in treatment and prevention”). The summary is intentionally rewritten, so omitted source-summary sentences are not errors. However “المزعوم” introduces a skeptical tone absent from the author's text and stronger than neutral attribution.
- Recommendation: if the synopsis is meant to describe the author neutrally, use “الدور الذي ينسبه إليه المؤلف” or remove “المزعوم”. This is an editorial fidelity issue, not an assessment of the medical claim.

### N03 — A04 Arabic frequency/certainty weakened (minor fidelity)

- Block 30, list item 0: FR “Le riz [...] est **presque toujours** bien toléré” → AR “الأرز [...] يُتحمل جيداً **في معظم الحالات**”. “Almost always” becomes “in most cases”. Recommendation: preserve “دائماً تقريباً”.
- Block 59, paragraph: FR “il est **illusoire** de trouver des poissons totalement exempts de contaminants” → AR “**يصعب** العثور على أسماك خالية تماماً من الملوثات”. “It is illusory/unrealistic” becomes “it is difficult”, weakening the author's categorical statement. Recommendation: preserve the source's degree of certainty, such as “من الوهم توقع العثور على ...”.

### N04 — A04 Arabic typo changes “toxins” to “marks” (minor)

- Block 34, paragraph: FR “des mutagènes et des **toxines lipophiles**” → AR “مواد مسببة للطفرات **وسوماً تذوب في الدهون**”. “وسوماً” means marks/tags rather than toxins; the required word is “وسموماً”. Recommendation: correct this one-word typo.

### N05 — A04 Arabic substitutes a different vegetable (moderate)

- Block 70, paragraph vegetable enumeration: FR “poireau, **salsifis**, ainsi que les légumes exotiques” → AR “الكراث، **والخرشوف الإسباني**، وكذلك الخضراوات الغريبة”. Spanish artichoke/cardoon is not salsify. English correctly retains “salsify”. Recommendation: use an Arabic name identifying salsify unambiguously, for example “السالسيفي (salsifis)”, instead of Spanish artichoke.

### N06 — A09 Arabic can incorrectly exclude gentle cooking (moderate)

- Block 68, list item 1: FR “Alimentation : légumes variés (fibres douces), **exclusion des légumineuses fermentescibles, cuisson douce** (vapeur, étouffée).” → AR “الغذاء: خضراوات متنوعة (ألياف لطيفة)، **مع استبعاد البقوليات القابلة للتخمّر والطهو اللطيف** (بالبخار أو على نار هادئة).”
- The French lists gentle cooking as a recommended method; the Arabic coordination after “استبعاد” naturally places both fermentable legumes **and gentle cooking** within what is excluded. This can reverse a practical dietary instruction.
- Recommendation: explicitly separate the exclusion from the positive instruction, e.g. “مع استبعاد البقوليات القابلة للتخمّر، واعتماد الطهو اللطيف ...”.

### N07 — A10 Arabic changes taxonomic level (minor technical fidelity)

- Block 55: FR “environ **400 espèces bactériennes** cohabitent dans le grêle” → AR “تتعايش نحو **400 فصيلة بكتيرية** في الأمعاء الدقيقة”. “فصيلة” denotes family; source specifies species. Recommendation: “نحو 400 نوع من البكتيريا”.

### N08 — A10 Arabic obscures the specific molecule class (minor technical fidelity)

- Block 64: FR “libère peptides et **lipopolysaccharides**” → AR “يطلق ببتيدات **ودهوناً سكرية متعددة**”. The Arabic reads as multiple glycolipids, not the specific lipopolysaccharides of the source. Recommendation: use “عديدات السكاريد الشحمية (LPS)” or equivalent precise Arabic terminology.

### N09 — D05 Arabic near-total response rate weakened (minor/moderate fidelity)
- Location: block 17, paragraph.
- FR: “Chez la **presque totalité** des patients atteints de Behçet, les rémissions sont complètes ou quasi complètes.”
- AR: “تكون الهدأة كاملة أو شبه كاملة لدى **معظم مرضى بهجت تقريبًا**.”
- Meaning: the source claims “almost all”; Arabic says approximately “most,” weakening the stated proportion and awkwardly qualifying “most.” This is a source-fidelity correction, not validation of the efficacy claim.
- Recommendation: express the original quantifier explicitly, e.g. “لدى جميع مرضى بهجت تقريبًا”. English preserves “almost all.”

### N10 — D05 English tentative description made categorical (minor precision)
- Location: block 2, first sentence.
- FR: “une vascularite systémique **d’allure auto-immune**”.
- EN: “systemic vasculitis **of an autoimmune nature**”.
- Meaning: “d’allure” describes autoimmune-looking/apparently autoimmune vasculitis; “of an autoimmune nature” states the nature as settled. Impact is limited because later source passages themselves call it autoimmune without qualification.
- Recommendation: “systemic vasculitis with autoimmune features” or “apparently autoimmune systemic vasculitis” to retain the local qualification. Arabic “ذي طابع مناعي ذاتي” is a defensible rendering of character/appearance and is not counted separately.

## Title adaptations and acceptable differences

English display titles often shorten or neutralize the French wording. These are not body omissions: A01 drops the daily-health subtitle; A05 omits “perspectives”; A07 changes “invisible threats” to “exposures and health”; A08 and A11 replace metaphorical subtitles with “Understanding”; A10 softens “key” to “and”; A12 and A14 drop “hypotoxic” from the title. The article bodies retain the named approach and corresponding source material.

A13 deserves editorial attention: French “Grossesse - Un voyage sacré du désir d’enfant au post-partum” becomes English “Nutrition through pregnancy and postpartum”. This replaces the overall sacred motherhood journey with a nutrition emphasis and omits the preconception scope from the title, although both remain in the body. Treat this as a title adaptation to confirm separately from the body findings, particularly if literal title fidelity is required.

Arabic title renderings preserve the main source scope. Natural metaphor, word order and transliteration changes were not counted as defects. A07 Arabic “permaculture” becoming “sustainable agriculture” (block 54) is a minor generalization recorded for completeness.

## Detailed coverage notes

- A00: title, rewritten summaries, and blocks 0–46 fully read in FR/EN/AR. No substantive translation defect identified. The EN/AR summaries are intentionally new synopses rather than literal translations; body preserves the source's efficacy and certainty claims.
- A01: title, rewritten summaries, and blocks 0–123 fully read in FR/EN/AR. No substantive translation defect identified. The EN title is shortened (drops “Un outil de santé au quotidien”); this is a display-title abbreviation, not a body omission. Minor natural wording differences (e.g. living/natural food) do not change the key source guidance or claims.
- A02: title, rewritten summaries, and blocks 0–59 fully read in FR/EN/AR. No substantive translation defect identified. Comparisons, historical dates, chromosomal count and all condition-list entries retained.
- A03: title, rewritten summaries, and blocks 0–34 fully read in FR/EN/AR, including all six resistant-condition items, four responsive-condition items and eleven cause-of-failure items. Two Arabic frequency qualifiers weakened; one separate Arabic synopsis-tone issue below. No substantive EN body defect identified.
- A04: title, rewritten summaries, and blocks 0–161 fully read in FR/EN/AR. All ingredients, preparation instructions, exclusions/exceptions and numeric claims read. No substantive EN defect identified. Arabic findings below.
- A05: title, rewritten summaries, and blocks 0–36 fully read in FR/EN/AR. No substantive translation defect identified. Medication passages, all adherence figures, duration recommendations, deficiency and infection statements retain supplied claims and qualifications.
- A06: title, rewritten summaries, and blocks 0–67 fully read in FR/EN/AR. No substantive translation defect identified. All molecular steps, allele/chromosome references, examples and list qualifications retained.
- A07: title, rewritten summaries, and blocks 0–99 fully read in FR/EN/AR. No substantive translation defect identified. EN title is a neutral rewrite (“Environmental exposures and health”); body retains supplied scope, qualifications and claims. Arabic broadens “permaculture” to sustainable agriculture at block 54, a minor terminology generalization rather than a medical meaning defect.
- A08: title, rewritten summaries, and blocks 0–64 fully read in FR/EN/AR. No substantive translation defect identified. All disease groups, food exclusions, recipe alternatives and the medical-supervision/nonreplacement language retained.
- A09: title, rewritten summaries, and blocks 0–108 fully read in FR/EN/AR. All plate ratios, exclusions, precautions, condition lists, evidence descriptions and comparison sections read. No substantive EN defect identified; Arabic negation-scope issue below.
- A10: title, rewritten summaries, and blocks 0–121 fully read in FR/EN/AR, including numeric surface areas, bacterial concentrations, all cell types, tests, mechanisms and qualifications. No substantive EN defect identified. Arabic terminology issues below.
- A11: Read title/summary and all blocks 0–69 in FR/EN/AR, including enzyme classifications, all nutrient examples, inhibitors, genetic variants and source therapeutic claims. No substantive translation defects identified. English title is shortened to “Understanding enzymes”; synopsis is intentionally rewritten. Natural metaphor and terminology variations retained the body meaning.
- A12: Read title/summary and all blocks 0–75 in FR/EN/AR, including all causes/food lists, all 12 cells in the sample-day table (block 48), and medical complementarity qualifications. No substantive translation defects identified. English title is abbreviated and summaries rewritten; body source assertions and the dated naming note were retained (not fact-checked).
- A13: Read title/summary and all blocks 0–99 in FR/EN/AR, including preconception, all trimesters, childbirth, both postpartum periods and all named traditional ingredients/practices. No substantive body translation defects identified. English title is recast around nutrition and postpartum; original's sacred-journey wording remains represented in body. Summaries intentionally rewritten. Poetic substitutions and resolution of awkward French “couple” references were acceptable natural wording.
- A14: Read title/summary and all blocks 0–64 in FR/EN/AR, including every age range, exclusion, water instruction, texture and recipe example. No substantive translation defects identified. English display title omits “hypotoxic” but body presents the named approach faithfully. This is a fidelity review of supplied infant-feeding claims, not medical validation.
- A15: Read title/summary and all blocks 0–37 in FR/EN/AR, including every mechanistic assertion, list item, example meal, negation/only qualifier and medical follow-up statement. No substantive translation defects identified. Rewritten summaries introduce attribution appropriate to a synopsis; body claims remain equivalent.
- D05: Read title/summary and all blocks 0–38 in FR/EN/AR, including every diagnosis/mechanism/result list, treatment name, percentage, comparison and limitation for longstanding disease.
- D06: Read title/summary and all blocks 0–28 in FR/EN/AR, including every patient count/outcome breakdown, time period, disease description and proposed mechanism. No substantive translation defects identified. The translated lists preserve all reported totals, percentages, outcomes and qualifications.

## Final scope and limitations

- All 18 assigned articles (A00–A15 and D05–D06) fully read in aligned French, English and Arabic, including every body block and every list/table entry, plus titles and summaries. No sample-only pass claims.
- Translation comparison used normalized French JSON as baseline. Raw client Word/PDF fidelity and rendered-site completeness are separate checks owned by the coordinating agent. This report alone does not establish those layers.
- This review assesses meaning fidelity, not the truth, safety or clinical validity of medical assertions. It deliberately preserves source assertions and does not fact-check them.
- Summary rewrites were treated as intentional. Shortened display titles are recorded below as editorial differences rather than body omissions; whether these title adaptations were authorized is for the coordinating source/implementation review. N02 is isolated because it adds a skeptical judgment rather than merely condensing content.
- No production files were edited and no source material was uploaded externally.
