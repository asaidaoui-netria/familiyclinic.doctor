# Publications fidelity audit — 3 October 2026

The initial audit found the collection complete and the French article bodies faithful to the supplied manuscripts. Confirmed translation meaning changes were concentrated in Arabic. English had one minor qualification issue and two source-quantifier ambiguities. Seven French summaries had also lost nonbreaking hyphens during import.

**Implementation update:** All confirmed corrections below have now been applied and verified, along with the unambiguous terminology refinements. See [corrections and verification](corrections.md) for the implemented changes and remaining source-intent/editorial decisions. The original findings and evidence below describe the pre-correction snapshot and remain available for traceability.

## Scope and method

The review covered all **56 client article manuscripts**, their French vignettes, all English and Arabic editions, supplied article imagery, and the current generated HTML: **168 article pages**. The source collection contains **152,251 words**, including manuscript titles. The four client branches contain A:16, B:9, C:25 and D:6 articles, with no missing or extra article manuscript in the implementation catalog.

French body text was extracted independently from Word XML, including list text, tables and nonbreaking hyphens, and compared after Unicode/whitespace normalization. Both legacy `.doc` manuscripts were freshly converted with LibreOffice and independently cross-checked with macOS `textutil`. This audit did not regenerate the production JSON with its importer. Article source hashes were compared with the actual supplied file bytes.

Every aligned body block in French, English and Arabic was read for translation meaning: **4,173 block positions per language**, including every list item and table cell, plus titles and summaries. The coordinator rechecked the principal reported discrepancies against the current files. A fresh build was parsed independently to compare the HTML article text against each edition. Numeric/operator differences were inspected individually.

Medical accuracy of the client's assertions was outside scope. The cookbook PDF excerpts were also outside this **article** audit. This is an AI-assisted fidelity review; semantic judgments remain subject to translator/editor review.

## Verified preservation

| Check | Result |
|---|---|
| Client manuscript inventory | All 56 accounted for, in their supplied architecture branches |
| French body text and title | 56/56 exact matches after whitespace normalization; no omitted or added body prose |
| Source hashes | All 56 match the actual files and all three edition records |
| Original tables | All 9 match the French implementation cell for cell |
| Translated structure | All 112 translations preserve block types/order, list hierarchy, item counts and table dimensions |
| Numeric values and comparison symbols | No changed numeric value found; nine notation differences and one `< 40` → “under 40” rendering are equivalent |
| Generated article bodies | 168/168 preserve the complete stored text and figure references |
| Images | All 56 supplied cover illustrations retained as resized WebP; C04's body diagram retained; B04's embedded image is pixel-identical to its supplied cover and is represented in the hero |

These checks establish completeness. They do not detect semantic mistakes such as reversing who responded to a treatment.

## Corrections to prioritize

Block and list-item indices below are zero-based.

| Location | Source → implemented meaning | Required correction |
|---|---|---|
| [B07 ar](/Users/abderrahmansaid-alaoui/Development/family-clinic/content/publications/B07/ar.json:169), blocks 38 and 56 | “Only one remained unresponsive” → `لم يستجب سوى واحد` (“only one responded”). Both passages first report 12 clear and 2 partial responders, so the last clause contradicts those counts. | Preserve the one nonresponder: `وبقي مريض واحد فقط دون استجابة`. |
| [A09 ar](/Users/abderrahmansaid-alaoui/Development/family-clinic/content/publications/A09/ar.json:536), block 68, item 1 | French excludes fermentable legumes and recommends gentle cooking. Arabic puts both under `استبعاد` (“exclusion”), making the cooking instruction ambiguous/reversed. | Separate the positive instruction: `مع استبعاد البقوليات القابلة للتخمّر، واعتماد الطهو اللطيف ...`. |
| [D01 ar](/Users/abderrahmansaid-alaoui/Development/family-clinic/content/publications/D01/ar.json:420), block 65 | “These manifestations are **often** signs...” becomes an unqualified assertion that they are signs. | Restore `غالباً`; adding “according to this model” does not preserve the frequency limitation. |

## Other localized body discrepancies

| Location | Finding |
|---|---|
| [B04 ar](/Users/abderrahmansaid-alaoui/Development/family-clinic/content/publications/B04/ar.json:32), blocks 4, 26 item 4, 74, 125; [B08 ar](/Users/abderrahmansaid-alaoui/Development/family-clinic/content/publications/B08/ar.json:90), blocks 18 and 25 item 1 | “Progressive/evolving” becomes “advanced,” changing progression over time into disease stage/severity. Use wording such as `يتفاقم تدريجيًا`. |
| [A03 ar](/Users/abderrahmansaid-alaoui/Development/family-clinic/content/publications/A03/ar.json:115), blocks 20 and 22; [A04 ar](/Users/abderrahmansaid-alaoui/Development/family-clinic/content/publications/A04/ar.json:155), block 30 item 0; [D05 ar](/Users/abderrahmansaid-alaoui/Development/family-clinic/content/publications/D05/ar.json:109), block 17 | “Almost always/almost all” becomes “most/in most cases,” weakening the source quantifier. |
| [A04 ar](/Users/abderrahmansaid-alaoui/Development/family-clinic/content/publications/A04/ar.json:291), block 59 | “It is illusory/unrealistic to find...” becomes “it is difficult to find...,” weakening the categorical source wording. |
| [A04 ar](/Users/abderrahmansaid-alaoui/Development/family-clinic/content/publications/A04/ar.json:180), block 34 | `toxines` is mistyped as `وسوماً` (marks/tags); it should be `وسموماً` (toxins). |
| [A04 ar](/Users/abderrahmansaid-alaoui/Development/family-clinic/content/publications/A04/ar.json:347), block 70 | `salsifis` is replaced by `الخرشوف الإسباني` (Spanish artichoke). Retain an unambiguous salsify term, with the French name if needed. |
| [A10 ar](/Users/abderrahmansaid-alaoui/Development/family-clinic/content/publications/A10/ar.json:308), block 55 | 400 bacterial **species** become 400 bacterial **families** (`فصيلة`); use `نوع`. |
| [A10 ar](/Users/abderrahmansaid-alaoui/Development/family-clinic/content/publications/A10/ar.json:383), block 64 | `lipopolysaccharides` becomes a phrase meaning multiple glycolipids; use the precise molecule-class term, e.g. `عديدات السكاريد الشحمية`. |
| [C04 ar](/Users/abderrahmansaid-alaoui/Development/family-clinic/content/publications/C04/ar.json:349), block 49 item 0 | “Onset in adulthood” becomes “at puberty age”; use `لدى البالغين` or `في مرحلة الرشد`. |
| [C20 ar](/Users/abderrahmansaid-alaoui/Development/family-clinic/content/publications/C20/ar.json:446), block 71 | “Green vegetables” becomes “leafy vegetables”; “prevent” becomes “help prevent.” These narrow the food category and soften the stated effect. |
| [D05 en](/Users/abderrahmansaid-alaoui/Development/family-clinic/content/publications/D05/en.json:19), block 2 | `d’allure auto-immune` becomes “of an autoimmune nature.” “With autoimmune features” would retain the local qualification more precisely. Impact is limited because later source text itself uses categorical wording. |

## Editorial and source-intent decisions

These are recorded separately from confirmed omissions or reversed claims.

- **Ambiguous client quantifier:** [D03 en](/Users/abderrahmansaid-alaoui/Development/family-clinic/content/publications/D03/en.json:148) block 20 and [D04 en](/Users/abderrahmansaid-alaoui/Development/family-clinic/content/publications/D04/en.json:113) block 19 translate the irregular French `quasi majorité` as “almost all.” D03 Arabic also adds the sense of an overwhelming majority. The source does not clearly specify “majority” versus “almost all”; confirm the intended quantifier before changing either language. D04 Arabic stays closer to the source's majority wording.
- **Added attribution in Arabic body prose:** C20, C23, D01, D02 and D03 add phrases such as “in the author's opinion” or “according to this model” where the French asserts the proposition directly. The propositions remain present, but the voice/certainty changes. Exact locations are listed in the conditions review. Decide whether to preserve source voice strictly or adopt a consistent editorial attribution policy across languages.
- **A03 Arabic synopsis tone:** [A03 ar](/Users/abderrahmansaid-alaoui/Development/family-clinic/content/publications/A03/ar.json:5) calls the therapeutic role `المزعوم` (“alleged”), adding skepticism absent from the French. A neutral synopsis can attribute the claim without this judgment.
- **Terminology clarity:** C11 Arabic 18/66 uses the same word for “genetic” and “hereditary” in a passage distinguishing them; B08 Arabic 3/58/59/73/89 uses a naturopathy term that can also mean physiotherapy. C22 Arabic 26 item 2 preserves the French's broad drug-class shorthand, but could be made more explicit. C22 is **not counted as a confirmed mistranslation**.
- **Titles and summaries are adaptations:** English titles are often shortened or made more neutral, and English/Arabic summaries are newly written synopses. These are not literal reproductions of the client vignettes. For example, A13's title becomes “Nutrition through pregnancy and postpartum,” while the French title also emphasizes preconception and the overall motherhood journey; that material remains in the body. Confirm literal title/teaser fidelity separately if required.

## French vignette import issue

Seven French summaries omit **10 nonbreaking hyphens**: **A04, A08, B02, B04, C15, C23, D05**. Apart from those hyphens, the whole source vignette text after its heading is present. Examples include `auto-immunes` being concatenated and [C23 fr](/Users/abderrahmansaid-alaoui/Development/family-clinic/content/publications/C23/fr.json:5) rendering `Au-delà` as `Audelà`. This is a minor import/spelling correction, separate from the intact French article bodies.

## Evidence and full coverage

- [Nutrition review: A00–A15, D05–D06](nutrition-review.md) — 18 articles, 1,346 aligned blocks.
- [Autoimmune/accumulation review: B01–B09, C00–C07](autoimmune-review.md) — 17 articles, 1,432 aligned blocks.
- [Conditions/elimination review: C08–C24, D01–D04](conditions-review.md) — 21 articles, 1,395 aligned blocks.
- [Machine evidence and content fingerprints](evidence.json) — source comparisons, rendered-page comparisons, image checks and audit scope.

No article file changed during the initial audit. Its content-set fingerprint identifies the pre-correction state. The original comparison scripts and raw logs are retained locally in `.publication-work/fidelity-audit/`; subsequent correction evidence is linked from [the implementation update](corrections.md).
