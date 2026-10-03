# Publications fidelity corrections — 3 October 2026

All confirmed translation and import errors from the [initial audit](report.md) have been corrected. Changes affect **21 editions across 17 articles**: 13 Arabic editions, one English edition and seven French summaries. There are 39 targeted corrections across 38 distinct text fields; C20 has two corrections in the same paragraph.

## Corrected findings

Block and item indices are zero-based.

| Edition | Locations | Correction |
|---|---|---|
| B07 Arabic | 38, 56 | Both passages retain twelve clear responders, two partial responders and **one nonresponder**. |
| A09 Arabic | 68 item 1 | Gentle cooking is explicitly recommended alongside the exclusion of fermentable legumes. |
| D01 Arabic | 65 | Restored **often** to the source assertion about symptoms. |
| B04 Arabic | 4, 26 item 4, 74, 125 | Replaced advanced-stage wording with progression over time. |
| B08 Arabic | 18, 25 item 1 | Restored progressive fibrosis and progressive forms of disease. |
| A03 Arabic | 20, 22 | Restored **almost always**. |
| A04 Arabic | 30 item 0, 34, 59, 70 | Restored **almost always**, corrected the toxins typo, preserved **illusory/unrealistic**, and identified salsify without substituting another vegetable. |
| A10 Arabic | 55, 64 | Restored bacterial **species** and the precise lipopolysaccharide term. |
| D05 Arabic | 17 | Restored **almost all** patients. |
| D05 English | 2 | Preserved the qualified autoimmune description: “systemic vasculitis showing autoimmune features.” |
| C04 Arabic | 49 item 0 | Restored onset in adulthood. |
| C20 Arabic | 71 | Restored green vegetables and the source's **prevent** assertion. |
| A04, A08, B02, B04, C15, C23, D05 French | Summaries | Restored all ten nonbreaking hyphens directly from the client vignettes. |

## Additional wording refinements

- A03 Arabic summary: replaced the added skeptical “alleged” with neutral author attribution.
- A07 Arabic 54: identified permaculture explicitly, preserving the named practice rather than generalizing it to sustainable agriculture.
- B08 Arabic 3, 58, 59, 73, 89: consistently distinguished naturopathy from physiotherapy, with the original term given at its first occurrence.
- C11 Arabic 18 and 66: distinguished **genetic** disease from **hereditary** cancers without changing the hereditary references.

## Verification

- `npm run verify`: build, script syntax checks and **104 tests passed**.
- Independently re-extracted all 56 client manuscript/vignette pairs. **56/56 French bodies, 56/56 French summaries and all nine tables match** after whitespace normalization. All source hashes remain correct.
- Independently parsed the rebuilt HTML. **168/168 article bodies match their stored text**, including figure references.
- Compared all 168 edition files against a snapshot taken before these corrections. Only the intended 38 text fields changed. Article structure, list hierarchy, tables, numbers, titles, routes and source/translation metadata are preserved; all French bodies are unchanged.
- Read the corrected translation passages against their aligned French source. Existing tests also verify Arabic numeric preservation across the complete collection.
- `git diff --check` passed.

[Correction evidence](corrections-evidence.json) contains the exact before/after text, reasons, file fingerprints, source comparisons and rendered-page results. The initial audit's evidence remains unchanged. Local scripts and verification logs are retained in `.publication-work/fidelity-fixes/`.

## Remaining source-intent and editorial decisions

These were recorded separately from confirmed errors and were not silently resolved:

- **D03 block 20 and D04 block 19:** the irregular French phrase `quasi majorité` needs client clarification about whether it means a majority or almost all. The affected English passages and D03 Arabic remain flagged.
- **Arabic author/model attribution in C20, C23 and D01–D03:** the existing attribution wording remains pending a consistent editorial policy. D01's missing frequency qualifier was corrected independently.
- **Adapted titles and translated summaries:** existing editorial adaptations remain. The A03 synopsis's added skeptical judgment was corrected as described above.
- **C22 Arabic 26 item 2:** the broad drug-class shorthand matches the French source. Additional specificity remains optional, not a confirmed fidelity correction.

This work corrects fidelity to the supplied manuscripts. It does not constitute a new clinical review or change the existing translation review status.
