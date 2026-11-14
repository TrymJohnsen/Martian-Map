# Clean Approach — design direction

## Product scope

Clean Approach is a prototype of a planning tool for astronauts collecting rock samples at Bright Angel on Mars. It combines observed terrain and documented sample context with an illustrative activity plan, and shows how gloves and tools could connect earlier activities to a sample's contact history.

Keep claims precise: the map target is a nominal placement based on the Sapphire Canyon sample report, not a verified drill point. Site A, the route, astronaut actions and possible contact paths are hypothetical. They do not show measured contamination, transfer, probability, risk, a real NASA operation or a validated EVA procedure.

## One map, three steps

Keep the same terrain map visible as the working surface while the user moves through three keyboard-accessible steps:

1. **Mission** — introduce Bright Angel, distinguish the documented nominal target B from hypothetical work site A, give one short reason the sample is scientifically relevant, and offer **Plan sampling**.
2. **Plan** — compare **Reuse the tool** (T1 at A and B) with **Use a separate tool** (T1 at A, T2 at B). Show Glove G1 and the tool at each activity; keep the walking route distinct from contact history. The primary action is **Trace sample history**.
3. **Sample history** — focus on Sample B. Compute source paths from the existing ordered event model, keep place/event/object names understandable, and let users switch plans here. If the model contains G1 → T2 → Sample B, explain **Different tool. Shared glove history.** Plan C is secondary, states that it omits only modeled G1 → T2 at B, and is described as a counterfactual rather than a procedure.

Show only the active step's task and explanation. Keep one clear primary action per step, readable type, generous spacing and neutral plan selection. Data sources, coordinate limitations, terrain layers, route length, elevation profile and ray-separation diagnostic are available on request under **Data & assumptions** or **Terrain analysis**. Opening those details must not reset the selected step or plan.

The visible caveat remains **Illustrative EVA · possible contact history, not measured contamination**. Contacts appear in the history, never as terrain lines; the map's solid line is the illustrative walking route. No camera motion is needed to navigate the steps.

## Walkthrough and accessibility

The walkthrough uses the same three steps and live scenario/model as the interactive flow. Users can start, stop, restart, or move manually while keeping the current model state. Timed advancement is disabled under reduced-motion preference; manual navigation remains available. Use real buttons, visible keyboard focus and `aria-current="step"` for step navigation.

## Terrain and evidence labels

Preserve the checked-in Bright Angel derivative: 175×147 pixels in Mars 2015 ocentric equirectangular projected coordinates, 20.399228 m/pixel in each axis. Keep the observed image, DTM and ray-separation arrays on their shared grid and mask, retain NoData gaps, and preserve the existing metre conversion and true vertical scale. The image is a display-only grayscale stretch with no documented physical units. Elevation exaggeration, when enabled, must remain explicitly labelled. Ray separation is a relative stereo diagnostic, not DTM accuracy or uncertainty; no uncertainty map is supported by available evidence.

Keep the PDS coordinate's unknown datum and horizontal accuracy, nominal placement, and unresolved ~29.8 m CTX/PDS elevation mismatch in details. Do not call the cell-centre offset a position accuracy.

## Browser review

The 1440×900 Chromium captures show each step with the map retained:

- [Mission · 1440×900](../output/playwright/clean-approach-step-1-mission-1440x900.png)
- [Plan · 1440×900](../output/playwright/clean-approach-step-2-plan-1440x900.png)
- [Sample history · 1440×900](../output/playwright/clean-approach-step-3-history-1440x900.png)

## Later video idea

Preserve the imagined opening **“LIFE DETECTED. … It’s you.”** and closing **“Find Mars. Not ourselves.”** The opening is a fictional narrative frame, not a discovery claim. Video production is a separate later task.
