# Clean Approach design reference

## Product shape

The page is a field guide for one question: could an explorer's approach affect the sample's contact history? The opening must place the real Jezero terrain and the illustrative sample target in view immediately. The user can choose **collect first** or **survey first**. That changes the order and route drawing, the grid-derived route profile, and the geometric path length inside the scenario footprint before collection. It does not estimate transfer or contamination.

## Existing experience inspection and first design alternatives

The original implementation was inspected from HTML, CSS and JavaScript; no local browser binary or browser automation is available in the agent environment. It could not be visually tested there. Its visible opening is a large brand heading followed by a map, while the decision is lower in a dense side column. A user can choose collect-first or survey-first. The choice changes the route order, profile to the sample, straight-segment total and the drawn line length inside a 7-cell target footprint before collection. The previous overlap calculation incorrectly included the whole start-to-survey leg; it has been corrected to include only segment portions inside the footprint. The old camera tour had no reset button, used an externally fetched web font and displayed a hardcoded location string.

The two runnable layouts use the same map, scenario, controls and evidence. Switch with the in-page A/B buttons or open `/?layout=a` and `/?layout=b`.

| Option | First impression and hierarchy | Strength | Tradeoff |
|---|---|---|---|
| **A · Terrain first** | Map takes about 70% of the desktop workspace; a compact decision/results/source rail stays beside it. | Real terrain and target are immediately visible; quick to compare the two orders. | Less room for the evidential story; source details are collapsed. |
| **B · Guided field story** | Terrain remains sticky on the left; the right rail reads area → planned activity → possible conflict/result → sources. | Helps a non-specialist follow the mechanism without losing the map. | More text beside the map; vertical scrolling is more likely on shorter laptop screens. |

**Working recommendation:** start with A because this is a hands-on route comparison and the real terrain should be the first object seen. Keep B available for a judging/demo walkthrough if users need the causal steps spelled out. This is a recommendation for the human design choice, not a settled decision.

### Existing visual elements

- **Useful:** raster scene, selected layer buttons, labelled start/waypoint/target, order toggle, profile and direct data manifest.
- **Changed as confusing or generic:** brand-led headline is replaced by the bounded question; status dot/chip removed; repeated evidence strip removed; map coordinates now derive from the raster transform; route/footprint values are labelled scenario/derived; excess gradients and external fonts removed.
- **Still optional:** the Perseverance image is a method reference at a different site. It may help explain witness tubes but is not evidence for the mapped scenario. If it distracts, move it behind source details after the first user review.

## Layout and hierarchy

- Keep the terrain visible beside the decision throughout the experience.
- **A — Terrain first:** terrain takes roughly two thirds of a laptop viewport; a compact side rail contains target, order choice, consequence and source details.
- **B — Guided field story:** persistent terrain sits beside a short numbered sequence: area/target, planned activity, possible conflict, choose an order, inspect the difference and limits.
- Give the map and the one user decision visual priority. Source details expand in place; they do not push the user through a long landing page.
- At narrower widths, stack controls below the terrain and keep all content in normal document flow.

## Type, color, spacing and controls

- Use a readable sans-serif for explanations, with 16 px body text as the default and 14 px as the minimum for supporting copy. Headings should be sentence case and specific.
- Reserve monospace for coordinates, units, product IDs and short metadata labels.
- Use a warm light background for reading, dark graphite only as the map surround, and Mars surface colors as the visual focus.
- Functional accents: green marks selected/collection sequence; blue marks survey; ochre marks the illustrative sample footprint. Every route marker also has a letter and text label; line styles distinguish planned legs.
- Use an 8 px spacing base, quiet borders, flat panels and clear visible keyboard focus. Avoid decorative glow, glass effects and background gradients.
- Buttons need explicit verbs/nouns and visible selected/pressed states. Keep one primary choice at a time.

## Camera and motion

- The camera is user controlled by default. A short tour is optional, visibly stoppable by the same button or by dragging, and has a reset control.
- Honor `prefers-reduced-motion`: no automatic camera movement; direct manipulation remains available.
- Mark the terrain's 3× vertical display exaggeration next to the grid spacing. Do not imply operational navigation precision.

## Evidence and uncertainty labels

- Show **Observed**, **Derived**, and **Scenario** as words, not colors alone.
- For each data layer, let users inspect mission/instrument, product/source, spatial resolution, acquisition/catalog time and limitations.
- Distinguish NoData from interpolation, product diagnostics and measurement uncertainty. Do not fill NoData as terrain. Do not call CTX ray separation an uncertainty value.
- Keep the CTX dates (2008 stereo inputs) distinct from the catalog timestamp. Ortho pixel units are undocumented in this item; its contrast stretch is display-only.
- The sample location, footprint, start, waypoint and action order are scenario inputs. The footprint is not a safe distance or transport radius.
- The Mars 2020 witness tube is a separate robotic precedent, not a local map layer or a crewed EVA protocol.

## Motion, meaning and access

Color is always paired with marker letters, line pattern, and copy. Interactive controls must have focus styling and useful accessible names. Loading and error states must explain whether the local raster could be loaded. Reduced-motion mode removes the automatic tour while retaining manual map interaction.
