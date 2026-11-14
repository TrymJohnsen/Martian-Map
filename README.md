# Clean Approach

**Clean Approach** is a small Marswalk planning prototype about keeping sample handling traceable. It pairs a real MRO/CTX terrain crop near Jezero with a Mars 2020 Perseverance witness-tube reference, then lets a user compare two illustrative activity orders. It shows contact opportunities and terrain context; it does not predict contamination or astronaut safety.

## Open the demo

From the repository root in a terminal:

```bash
python3 -m http.server 4173 --directory public
```

Open <http://localhost:4173>. The NASA Photojournal reference image requires browser internet access; the terrain demo data are local.

The agent environment used to prepare this prototype does not permit local socket binding, and no headless browser is installed there. The command above is intended for the team's regular Ubuntu machine; check both sequence buttons, the three surface modes and camera controls there.

## What is real, calculated, and illustrative

- **Real:** the 148×148 MRO/CTX DTM, orthorectified image and ASP intersection-error crop; the Perseverance CacheCam witness-tube image/reference.
- **Calculated:** route distance and elevation profile sampled from the CTX grid; rendered terrain mesh and display stretch.
- **Illustrative:** target/start/waypoints, target footprint, route order, contact interpretation, and a proposed witness/check step. The witness-tube analogy is robotic and does not establish a crewed EVA protocol.

The data crop's orthoimage and DTM both have 20.16 m/pixel spacing. The intersection-error image is a stereo ray-separation diagnostic, not terrain accuracy or uncertainty. No contamination score, plume, probability, or safe distance is calculated.

## Rebuild the small demo data derivative

The original GeoTIFFs are ignored under `data/raw/jezero/`. With the existing environment:

```bash
MPLCONFIGDIR=/tmp/martian-map-mpl .venv/bin/python scripts/build_demo_data.py
```

## Project notes

- [Current status and suggested evening work blocks](docs/STATUS.md)
- [Science basis and closest prior art](docs/science.md)
- [Data products and actual sample results](docs/data-sources.md)
- [Data format](docs/data-contract.md)
- [Major decisions](docs/decisions.md)
- [Challenge and submission requirements](docs/challenge.md), [submission details](docs/submission.md)
- [30-second demo script](docs/demo-script.md)
