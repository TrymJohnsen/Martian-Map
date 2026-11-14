# Current status — Clean Approach

## Demonstration

The first screen puts the observed MRO/CTX Bright Angel terrain, nominal target B, the A/B tool choices and Sample B's calculated source paths together at 1440×900. The default view shows **Reuse the tool**. **Use a separate tool** recomputes the same event model and shows the remaining Glove G1 → Tool T2 → Sample B path when that path exists. Plan C is a secondary counterfactual that omits only the modeled G1 → T2 contact at B.

The five-step **Walk me through it** uses the live model: science target, activity at A, arrival/collection at B, shared-tool history, and separate-tool history. It advances without camera motion; Stop, Restart and Previous/Next are available. Under reduced-motion preference, it waits for manual steps.

- [Reuse the tool · 1440×900](../output/playwright/clean-approach-reuse-tool-1440x900.png)
- [Use a separate tool · 1440×900](../output/playwright/clean-approach-separate-tool-1440x900.png)

## Data limits

- B is a nominal target-area placement from the PDS report associated with Sapphire Canyon, not a verified drill point. Coordinate datum and horizontal accuracy are not stated.
- The PDS and CTX elevations at B differ by about 29.8 m; cause remains unresolved.
- A, the traverse and contact chain are illustrative. Reachability is not measured transfer, contamination, probability, safety or EVA guidance.
- CTX DTM/ortho posting is about 20.4 m. NoData remains blank. ASP ray separation is a relative stereo diagnostic, not terrain uncertainty.

## Verification

On 2026-11-14, Playwright/Chromium at 1440×900 showed the complete first-screen comparison with no page scrolling. Both plan choices recomputed their results and reset to B's sealed event so previous history did not remain. Map clicks at A and B and source trace links selected their corresponding ordered events. The walkthrough start/stop, timed advance, restart and manual steps were exercised; reduced-motion mode displayed its note and required manual advance. Source details opened with the coordinate and elevation caveat. Browser console: no errors or warnings.

```bash
node --check public/app.js
node --check public/scenario.js
node --test tests/contact-model.test.cjs tests/terrain-geometry.test.cjs
.venv/bin/python tests/test_geospatial_export.py
git diff --check
```

The agreed future video idea remains “LIFE DETECTED. … It’s you.” and closes with “Find Mars. Not ourselves.” No video production is included here.
