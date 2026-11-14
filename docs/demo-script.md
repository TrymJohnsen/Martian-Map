# Demo script (English)

All results below are replayed from the ordered event model with the **default checklist choices and assumptions** (`buildMission`, [docs/model.md](model.md#mission-checklist-scenario)). They are possible contact paths under stated scenario assumptions, not measured contamination.

## 30-second version

> At Bright Angel, Sapphire Canyon is a science target because researchers reported organic compounds and mineral associations. Its map position comes from the sample report and is approximate. In this illustrative EVA the astronaut builds a sampling sequence, and the tool replays it as a history: every glove, tool and surface that touches Sample B is recorded in order. Following the whole checklist still leaves a possible human-associated path to the sample, because the model lets no step remove a contact. What a step changes is which paths exist, and the history shows which step created each one.

## Sample B history (default sequence)

Sample B is the sample at the nominal Sapphire Canyon target. Site A is a hypothetical earlier sample site. The history is read in event order:

| # | Where | Step | What the history records for Sample B |
|---|---|---|---|
| 1–2 | Prep | Check the sealed kit | Tool T2, the tongs and tube B are recorded as sealed and unopened. No contact yet. |
| 3–7 | A | Document and collect sample A | Outer glove G1 and Tool T1 contact site A, and sample A is sealed. These are the only contacts that carry A-associated material. |
| 8 | A | Bag the used tool | T1 is recorded as bagged and out of the B work zone. Bagging adds a record and removes no path. |
| 9–10 | Zone boundary | Change the outer glove | G1 is bagged. G2, which was not used at A, goes on. **The A path stops here, because G1 has no contact at B.** G2 is assumed to carry possible human-associated material. |
| 11–13 | B | Photograph the target, open the witness tube | B's own material is recorded at the surface. The witness-tube record lets the surroundings be characterized later. It removes no path. |
| 14 | B | Collect sample B with the tongs | The tongs contact the B surface and the sample. G2 holds the tongs, so that contact is stated too. |
| 15 | B | Seal tube B | The sample's history is frozen. The seal check (surface checked) is a recorded status, not a path change. |
| 16 | B | Log the IDs | Sample, tube and witness-tube IDs are recorded for later matching. |

### Result: sources with a modeled path to Sample B

| Source group | Path | Created by |
|---|---|---|
| Possible human-associated material | G2 → tongs → Sample B | G2 put on (step 4, an assumption you can switch off), then the collection at B (step 6) |
| B's own sample origin | B surface → tongs → Sample B | The B collection (step 6) |
| Possible material from sample site A | **No path** | G1 and T1 never contact B in this sequence |

The work-zone rule (G1 and T1 stay out of the zone around B) raises no warning. The result is a statement about the listed edges. It does not say the sample is clean, and it does not say that anything was transferred.

## What changes the history

Change one input and the history is replayed from scratch:

| Change | Result for Sample B |
|---|---|
| Keep G1 on at the boundary | A-associated, human-associated and B's own paths. A work-zone warning names G1 (G1 → tongs → B). |
| Sample with Tool T1 | The same three groups. A work-zone warning names T1 (A surface → T1 → B). |
| G2 assumed free of human-associated material | B's own path only. This is a labelled what-if; no data shows an outer glove put on during an EVA is free of it. |
| G2 free, but G1 → G2 contact switched on | The A path and the human path return through the glove change. |
| Equipment treated as a source | Adds a fourth group through the sampler or tube B. |
| Open or leave the witness tube, check or skip the seal check | No path changes. Only the recorded status changes. |

## What to say, and what not to

- Say "possible contact path", "under the stated assumptions" and "scenario step". The checklist steps are inspired by documented practice (Perseverance tubes and witness tubes, Apollo bags and tongs) and are not a validated EVA protocol.
- Do not say a sequence prevents contamination, is safe or clean, or has a risk or a probability. The model has none of these.
- B's map position is nominal. The report gives no coordinate datum or accuracy, so do not say the marker is the drill hole.
- Site A, the route and the human-associated source are illustrative inputs. Suit leakage, raised dust, wind and lander exhaust are not modeled; the panel lists them with the reason.

## Earlier example plans

The three example plans (reuse Tool T1, separate Tool T2 with Glove G1, and the plan that omits one contact) remain in the app as a short comparison. They show only that a separate tool does not by itself remove the modeled glove path. The checklist history above is the fuller story for the demo.
