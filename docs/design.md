# Clean Approach — visual and interaction direction

## Current direction

Use one compact dark-neutral field-study screen. At a 1440×900 laptop viewport, the observed terrain, nominal target B, the two main tool choices, the calculated Sample B history and the walkthrough controls should be visible together. Keep the terrain broad, the body copy short and the detailed source material in **Data & assumptions**.

The main choices are **Reuse the tool** and **Use a separate tool**. Show the gloves and tools used in each. Derive the explanation and source paths from the replayed event model. When G1 → T2 → Sample B exists, say **Different tool. Shared glove history.** Plan C remains secondary: **What if this contact is avoided?** and explicitly omits the modeled G1 → T2 edge at B. Do not call it clean, safe or validated.

Map clicks and source trace links select the related event and highlight its place. The solid map line is the walking route; contact chains appear in the event history and never as terrain lines. Ordered event details stay available but do not crowd the first screen. Label the scene **Illustrative EVA · possible contact history, not measured contamination**.

The five-step walkthrough uses the same scenario and replay as the controls. It may advance slowly, but has Stop, Restart and manual previous/next controls; it does not move the camera. Reduced-motion preference disables timed advancement. Keep keyboard focus visible, use readable type, and preserve distinct source colors without approval or risk symbolism.

## Science labels and map treatment

B is a nominal target-area marker based on the PDS sample report associated with Sapphire Canyon. It is not a verified drill point: coordinate datum and horizontal accuracy are unspecified. Keep the coordinate and the unresolved ~29.8 m elevation difference in Data & assumptions. Do not show the pixel-centre snap distance as location accuracy.

The checked-in Bright Angel derivative is 175×147 pixels in Mars 2015 ocentric equirectangular projected coordinates. Pixel spacing is 20.399228 m in both axes. DTM, orthoimage and ASP ray-separation diagnostic share the grid and valid-data mask. NoData remains blank. The DTM range is −2376.467 to −1841.575 m relative to the areoid; the 921 missing cells are 3.58% of the crop.

The surface image is a display-only grayscale stretch with unspecified physical units. The DTM is shown at true 1× vertical scale by default; optional 3× exaggeration stays explicitly labelled. Ray separation is a relative stereo-processing diagnostic, not elevation error, uncertainty or confidence. No uncertainty map is justified by the available evidence.

## Browser review

- [Reuse the tool · Chromium, 1440×900](../output/playwright/clean-approach-reuse-tool-1440x900.png)
- [Use a separate tool · Chromium, 1440×900](../output/playwright/clean-approach-separate-tool-1440x900.png)

The earlier Terrain First and Guided Field Story compositions were retired as visual directions; their terrain renderer, data and calculations remain. No new framework or design package is required.

## Later video idea

Preserve the imagined opening **“LIFE DETECTED. … It’s you.”** and closing **“Find Mars. Not ourselves.”** The opening is a fictional narrative frame, not a discovery claim. Video production is a separate later task.
