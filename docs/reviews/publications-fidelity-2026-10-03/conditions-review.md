# Conditions and elimination translation fidelity audit

Scope assigned: C08–C24 and D01–D04, French source JSON against complete English and Arabic translations. Read-only review; no production edits. Block and item/cell indices are zero-based. Summary wording may be intentionally rewritten and is distinguished from body omissions. This is semantic fidelity review, not verification of the source medical claims.

## Coverage

Complete AI-assisted semantic reading of all 21 assigned articles: titles, summaries, every body block, every list item and every table cell in French, English and Arabic. This covers **1,395 aligned blocks per language (4,185 block renderings across 63 JSON files)**. These counts document the completed reading, not an inference from structural tests. Any truncated batches were re-read before marking coverage.

| Article | Blocks reviewed (inclusive) | Block count | EN + AR review |
|---|---:|---:|---|
| C08 | 0–136 | 137 | Complete |
| C09 | 0–71 | 72 | Complete |
| C10 | 0–80 | 81 | Complete |
| C11 | 0–123 | 124 | Complete |
| C12 | 0–35 | 36 | Complete |
| C13 | 0–34 | 35 | Complete |
| C14 | 0–36 | 37 | Complete |
| C15 | 0–41 | 42 | Complete |
| C16 | 0–80 | 81 | Complete |
| C17 | 0–24 | 25 | Complete |
| C18 | 0–43 | 44 | Complete |
| C19 | 0–57 | 58 | Complete |
| C20 | 0–103 | 104 | Complete |
| C21 | 0–47 | 48 | Complete |
| C22 | 0–39 | 40 | Complete |
| C23 | 0–37 | 38 | Complete |
| C24 | 0–57 | 58 | Complete |
| D01 | 0–121 | 122 | Complete |
| D02 | 0–96 | 97 | Complete |
| D03 | 0–41 | 42 | Complete |
| D04 | 0–73 | 74 | Complete |

Limits: comparison is against normalized French JSON. Raw client Word/PDF-to-French and final rendered-page fidelity are handled separately by the root reviewer. This reviewer did not fact-check medical claims or use external uploads. No production file was edited.


## Findings overview

- **Confirmed qualification omission, medium:** D01 Arabic 65 drops “often” from the statement that symptoms are signs of clearance.
- **Minor meaning changes, low:** C20 Arabic 71 narrows green vegetables to leafy vegetables and changes “prevent” to “help prevent”.
- **Terminology clarification, not confirmed source-meaning defects:** C11 Arabic 18/66 (genetic/hereditary ambiguity) and C22 Arabic 26 item 2 (oral-antidiabetic class shorthand).
- **Source-intent ambiguity:** D03 block 20 (English and Arabic), D04 block 19 (English), where irregular French “quasi majorité” becomes stronger near-universal wording. These are not counted as confirmed errors.
- **Editorial reframing:** Arabic added author/model attribution in C20, C23, D01, D02 and D03, detailed below. The propositions remain present. Treat these separately from omissions/factual errors and decide using the intended localization policy.
- Titles and summaries are frequently editorial rewrites; no wholesale body omission, reversed negation, reversed numerical comparison or changed numeric amount/unit was identified in the assigned set. This is a bounded AI-assisted review, not proof that every wording choice is flawless.

Detailed coverage and evidence follow.

### C08 coverage completed
- Read title/summary and blocks 0–136 inclusive in fr/en/ar, including all list items and table cells.
- No material body meaning defect identified. Arabic reversal of standalone arrows is natural RTL adaptation; numerical thresholds and quantities are preserved.
- Editorial note: English title omits “Conseils pratiques”; English/Arabic summaries are concise rewrites, not literal translations. They retain the topic and practical-guide purpose; not treated as body omissions.

### C09 coverage completed
- Read title/summary and blocks 0–71 inclusive in fr/en/ar, including all table cells (including dosage, unit, duration, and medical-supervision qualifiers).
- No material body meaning defect identified. English title neutralizes “alliés cachés”; both summaries are editorial rewrites consistent with body scope.

### C10 coverage completed
- Read title/summary and blocks 0–80 inclusive in fr/en/ar, including all list entries and numbers/comparisons (1,200 patients, 5.5 years, 30 versus 3 cancers, nearly 90%, terminal/progressive cases, treatment limitations).
- No material body meaning defect identified. Source assertions and limitations are faithfully retained; this does not validate the underlying assertions. English title adds “model” and summaries editorially frame the theory, but the body remains source-faithful.

### C11 coverage completed
- Read title/summary and blocks 0–123 inclusive in fr/en/ar, including every gene list, progression sequence, percentage, and metastatic step.
- No confirmed omitted/added body claim found. One Arabic terminology ambiguity merits editorial review (below); English preserves source distinctions.

#### C11 / ar / block 66 (also 18): genetic versus hereditary — low severity terminology ambiguity
- French: “Le cancer est une maladie génétique, mais il ne faut pas confondre cancers héréditaires et cancers acquis.”
- Arabic: “السرطان مرض وراثي، لكن ينبغي ألا نخلط بين السرطانات الوراثية والسرطانات المكتسبة.”
- Explanation: “وراثي” is a conventional translation of genetic, but also means hereditary; in this specific contrast, using the same word makes the opening read as “Cancer is hereditary, but do not confuse hereditary and acquired cancers.” Later paragraphs correctly explain inheritance versus acquired mutations, so this is ambiguity rather than a confirmed reversal across the whole article.
- Recommendation: use “مرض جيني” or “مرض مرتبط بتغيرات جينية” for “maladie génétique” in blocks 18 and 66; retain “وراثية” for “héréditaires”. No change to the source claims is needed.

### C12 coverage completed
- Read title/summary and blocks 0–35 inclusive in fr/en/ar, including protocol list and all long paragraphs. Re-read truncated output at blocks 11–13 in full before marking coverage.
- No material body meaning defect identified; source efficacy/certainty language is retained. English title shortens the original and summaries are editorial rewrites.

### C13 coverage completed
- Read title/summary and blocks 0–34 inclusive in fr/en/ar, including all full paragraphs and protocol entries.
- No material body meaning defect identified. “Sometimes” remission qualifiers, indispensable conventional care in critical situations, and the source's stronger claims elsewhere are all retained without silently reconciling source inconsistencies.

### C14 coverage completed
- Read title/summary and blocks 0–36 inclusive in fr/en/ar, including surgical care/urgency language, limitations, and protocol. Re-read truncated blocks 9–11 in full.
- No material body meaning defect identified. Arabic and English preserve “sometimes” therapeutic effects and the source statements on serious complications/urgent care.

### C15 coverage completed
- Read title/summary and blocks 0–41 inclusive in fr/en/ar (all five disease sections).
- No material body meaning defect identified. Insulin remains explicitly indispensable to sustaining life (28), and nutrition remains complementary where the French calls it complementary (30, 39). The Arabic summary does not reproduce the French summary's integration/treatment sentence, but is a concise editorial rewrite and body treatment qualifications remain present.

### C16 coverage completed
- Read title/summary and blocks 0–80 inclusive in fr/en/ar, including every food list, all three clinical stories, recipe count, lifestyle qualifications, and conclusion.
- No material body meaning defect identified. Patient initials are localized to corresponding Arabic sequence letters; ages and case outcomes are retained.

### C17 coverage completed
- Read title/summary and blocks 0–24 inclusive in fr/en/ar, including all long list items in 8 and 20. Re-read block 8 separately after truncation.
- No material body meaning defect identified. The urgent-care statement for suicidal/delusional thoughts (8 item 6), hypothesis framing, numeric source assertions, and antidepressants' continuing necessity (21) are retained.
- English title generalizes “Dépression nerveuse endogène” to “Depression”; subtitle/summary/body still clearly identify endogenous depression. Editorial title precision note, not a body defect.

### C18 coverage completed
- Read title/summary and blocks 0–43 inclusive in fr/en/ar, including all genetic/epidemiological comparisons, 45%/17% remission comparison, 20%/3% antibody comparison, and treatment qualifications.
- No material body meaning defect identified. Conditional/hypothesis wording and the indispensable role of psychiatric care remain present; Arabic “هدوء للمرض” conveys remission naturally here.

### C19 coverage completed
- Read title/summary and blocks 0–57 inclusive in fr/en/ar, including every list, clinical percentage, participant count, treatment limitation, and conclusion.
- No material body meaning defect identified. Arabic explicit attribution “وفقاً لهذا النهج” in 39 clarifies the immediately stated hypothesis rather than adding a distinct claim; recorded as acceptable contextual wording.

### C20 coverage completed
- Read title/summary and blocks 0–103 inclusive in fr/en/ar, including duplicated source sections, all diagnostic/protocol lists, and full conclusion.
- English body: no material meaning defect identified. Arabic has the minor meaning changes and editorial attribution differences below. Summaries are editorial rewrites.

#### C20 / ar / blocks 16, 23, 34, 41, 64, 79, 98: added attribution qualifies source assertions — editorial reframing
- Representative French (79): “Ces résultats confirment que l’alimentation est un levier puissant dans la prise en charge des hémopathies.”
- Arabic (79): “تؤكد هذه النتائج، في رأي المؤلف، أن الغذاء أداة قوية في رعاية أمراض الدم.”
- Explanation: “في رأي المؤلف” adds “in the author's opinion” to a categorical statement that the results confirm something. Other additions similarly reframe categorical body statements as model-dependent: “وفق هذا النموذج” (16, 34), “وفق هذا الطرح” (23, 41), “وفق هذا النهج” (64), “وفق هذا التصور” (98). This is an editorial change in attribution/certainty absent from the French, even though the underlying proposition remains recognizable. It differs from concise editorial summaries because it occurs within body paragraphs.
- Additional exact pair (16): French “La leucémie est l’exemple extrême de la pathologie d’encrassage” versus Arabic “يمثل ابيضاض الدم، وفق هذا النموذج، المثال الأقصى على مرض تراكم الملوثات”.
- Recommendation: for strict source fidelity, remove the added qualifications or seek an explicitly approved, consistently applied editorial attribution policy for all languages. Do not silently change the source's claims only in Arabic.

#### C20 / ar / block 71: food category narrowed and efficacy softened — low severity
- French: “Les légumes verts, les légumineuses, les fruits secs et les graines…”
- Arabic: “الخضروات الورقية والبقول والفواكه المجففة والبذور…”
- Explanation: “légumes verts” is green vegetables; “الخضروات الورقية” is leafy vegetables, narrowing the stated category. Prefer “الخضروات الخضراء”.
- French: “L’hydratation et la réduction des graisses oxydées préviennent la destruction prématurée des cellules.”
- Arabic: “ويساعد شرب الماء وتقليل الدهون المؤكسدة على الوقاية من تدمير الخلايا المبكر.”
- Explanation: adds “helps” to the source's categorical “prevent”. Retain the source's degree of certainty if the goal is literal meaning fidelity.

### C21 coverage completed
- Read title/summary and blocks 0–47 inclusive in fr/en/ar (arterial/cellular/ocular/digestive/hepatic ageing, nutrition and conclusion).
- No material body meaning defect identified. Source references to sometimes reversing ageing and combining conventional treatments are both retained; “fascicule D” is also retained from French rather than silently corrected.

### C22 coverage completed
- Read title/summary and blocks 0–39 inclusive in fr/en/ar, including all long risk-factor/treatment lists, plaque fractions, geographic comparisons, and cholesterol reduction figures.
- No material English body meaning defect identified. Arabic medication-class terminology should be clarified as below.

#### C22 / ar / block 26 item 2: antidiabetic drug class shorthand — optional terminology clarification
- French: “Les antidiabétiques oraux (sulfamides, biguanides)…”
- English more specifically disambiguates: “Oral antidiabetics (sulfonylureas, biguanides)…”
- Arabic: “تساهم مضادات السكري الفموية، مثل السلفوناميدات والبيغوانيدات…”
- Explanation: Both French “sulfamides” and Arabic “السلفوناميدات” are broad sulfonamide terms, and both sentences explicitly provide the oral-antidiabetic context. English makes the hypoglycaemic sulfonylurea interpretation more explicit. The Arabic therefore preserves the source shorthand and is not a confirmed source-meaning defect; extra specificity would be an editorial clarification.
- Recommendation: optionally clarify with “السلفونيل يوريا” or an explicitly qualified equivalent for hypoglycaemic sulfonamides if the editorial policy favors disambiguating the source shorthand. No correction is required on source-fidelity grounds alone.

### C23 coverage completed
- Read title/summary and blocks 0–37 inclusive in fr/en/ar, including all symptom lists, 19/14 cohort, preliminary-results caveats, and the explicit no-definitive-cure/no-substitution statements.
- No material English body meaning defect identified. Arabic retains these limitations but repeats the added-attribution pattern seen in C20.

#### C23 / ar / blocks 17 item 1, 20, 33: added author/model attribution — editorial reframing (same pattern as C20)
- French (33): “Ces observations, bien que nécessitant des études plus larges, confirment que la nutrition peut agir sur les mécanismes d’encrassage…”
- Arabic (33): “ورغم حاجة هذه الملاحظات إلى دراسات أوسع، فإنها تؤكد، وفق الطرح المعروض، قدرة التغذية على التأثير في آليات تراكم الملوثات…”
- Explanation: adds “according to the presented account” to what the French presents as a confirmation by observations (already qualified by needing larger studies). The original qualification is preserved, but an extra qualification has been inserted into the body.
- French (20): “Il démontre que l’autisme ne peut être compris uniquement comme une anomalie génétique ou neurologique…”
- Arabic (20): “وهو يبين، بحسب هذا الطرح، أن التوحد لا يمكن فهمه بوصفه اضطراباً وراثياً أو عصبياً وحده…”
- French (17 item 1): “d’autres pathologies d’encrassage”; Arabic: “أمراض أخرى يربطها المؤلف بتراكم الملوثات” (“other diseases the author links to accumulation”).
- Recommendation: remove added attribution for strict body fidelity, or confirm a consistent and authorized editorial policy across all languages. These are modest reframings, not missing entire claims.

### C24 coverage completed
- Read title/summary and blocks 0–57 inclusive in fr/en/ar, including every condition and full conclusion.
- No material omitted/added clinical body claim identified. English title omits the accumulation concept; Arabic title/body sometimes names it a “model” (1, 9, 20), an editorial framing consistent with surrounding presentation, but full mechanisms and certainty remain stated. Distinguish this terminology from the explicit opinion insertions noted for C20/C23.

## D01 — complete

Reviewed title, summary, and every block 0–121 in French, English and Arabic, including every list item. English body retains the source's claims, clinical certainty, mechanisms, durations, exclusions and qualifications; no material English body defect found. Summaries are rewritten editorial descriptions rather than literal translations.

### D01 / Arabic / block 65 — medium: frequency qualification omitted

- French: « Loin d’être des anomalies, ces manifestations sont **souvent** des signes que l’organisme se décrasse. »
- Arabic: « وهذه المظاهر، وفق هذا التصور، ليست اضطرابات بل علامات على تخلص الجسم من التراكم. »
- The source says these symptoms are **often** signs of clearance. Arabic states categorically that they are signs of clearance, with no frequency qualifier. Adding “according to this conception” attributes the claim but does not preserve its “often” limitation. The same article's Arabic conclusion (116) correctly retains غالباً.
- Recommendation: restore غالباً in the final clause while preserving the source's exact assertion and tone.

### D01 / Arabic / blocks 6, 12, 34, 43, 65, 67, 115, 121 — editorial attribution changes (same pattern as C20/C23)

- Block 6 French: « Les résultats cliniques montrent que ce changement alimentaire peut prévenir ou guérir des maladies réputées incurables »; Arabic: « وتبين النتائج السريرية، **وفق هذا الطرح**، أن هذا التغيير الغذائي قد يقي من أمراض تُعد مستعصية أو يشفيها ».
- Block 121 French: « Elle valide les succès cliniques **obtenus par** une alimentation ancestrale »; Arabic: « وتؤكد النجاح السريري **المنسوب إلى** الغذاء السلفي » (“attributed to” rather than “obtained through”).
- Related insertions: 12/34/115 وفق هذه النظرية; 43/65 وفق هذا التصور; 67 في هذا التصور. These add author/model attribution absent at those points in the French body; block 115 also changes « Elle montre » to « فهي ترى » (“it sees/holds”). They are editorial reframings, not missing medical claims. Evaluate as one pattern rather than eight factual translation failures.
- Recommendation: remove added body attribution for strict fidelity, or adopt an explicitly approved, consistent editorial attribution policy across languages. This review assesses the preservation of source claims, not their medical correctness.

## D02 — complete

Reviewed title, summary, and every block 0–96 in all three languages, including all lists. No material omitted clinical claim or reversed comparison found. Checked 233/237 remissions (22–24), lifelong diet and immediate relapse qualification (24), 20/100 lymphocyte threshold (34), the inverse diarrhoea/joint-pain comparison (42), UC/Crohn distinctions including tobacco (58), explicit diet failures/no cure in UC (60–65), ages and prevalence (67), 44%/20% genetics figures (84), and 90%/15-year surgery claim (87). All are retained. Rewritten summaries are editorial, not literal.

Editorial attribution pattern in Arabic (not a confirmed factual/negation error): blocks 1 (وفق هذا التصور), 4 (في هذا الطرح), 79 and 95 (وفق هذا الطرح). Representative block 95: French « confirmant que la surcharge alimentaire moderne est la cause première »; Arabic « مما يؤكد، **وفق هذا الطرح**، أن الحمل الزائد الناجم عن الغذاء الحديث هو السبب الأول ». For strict fidelity remove added attribution, or use an approved consistent editorial policy across locales. Block 94's explicit reference to the elimination “model” is acceptable contextual framing of the source's already theoretical discussion.

## D03 — complete

Reviewed title, rewritten summary, and every body block 0–41 in all three languages, including all list items and the two clinical cases. Time spans, ages, recurrence, percentages, mortality comparison, irreversible-complication exclusions and early-treatment conditions are retained. Arabic block 1 adds وفق نظرية الإطراح (editorial attribution; no omitted claim).

### D03 / English and Arabic / block 20 — source ambiguity and potentially strengthened efficacy quantifier

- French: « Chez la **quasi majorité** des patients les rémissions sont complètes ».
- English: “In **almost all patients**, remissions are complete”.
- Arabic: « تكون حالات الهدوء تامة لدى **الغالبية العظمى تقريباً** من المرضى » (“almost the overwhelming majority”).
- The French phrase “quasi majorité” is itself irregular/ambiguous; it does not plainly say “quasi-totalité” or “grande majorité”. English resolves it into an almost universal response, and Arabic adds “overwhelming”. This should be resolved against the client's intended wording, rather than counted as a confirmed translation error without that clarification. It concerns an efficacy population quantifier, so merits review if strict source fidelity is required.
- Recommendation: confirm whether the intended source is majority or almost all, then preserve that quantifier consistently. Do not silently infer a stronger rate.

## D04 — complete

Reviewed title, rewritten summary, and every block 0–73 in French, English and Arabic, including all list items and clinical observations. The contact-eczema exception (diet has no major role, 25 item 5), constitutional-eczema distinction, failed/partial responses (49/64), inverse skin/joint response (65), irreversible scarring (19), study denominators and patient outcomes are retained. No material Arabic body defect found.

### D04 / English / block 19 — same source-quantifier ambiguity as D03

- French: « la **quasi majorité** ont vu leurs lésions disparaître totalement ».
- English: “**almost all** saw their lesions disappear completely”.
- Arabic: « شهدت **الأغلبية تقريبًا** اختفاء آفاتها تمامًا » retains the original's majority phrasing more closely here.
- “Almost all” resolves an irregular/ambiguous source expression toward near universality. The following French sentence says only a few had marked reduction, so the intended meaning may indeed be near universality. Treat this as an editorial/source-intent question, not a confirmed translation error.
- Recommendation: resolve the source's intended quantifier consistently with D03 block 20 before any change.
