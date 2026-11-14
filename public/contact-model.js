/* Qualitative contact-pathway model. It represents assumed contact reachability,
 * never transfer amount, probability, viability, or Mars establishment. */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.ContactPathwayModel = api;
})(globalThis, function () {
  const SEQUENCES = Object.freeze({
    "sample-first": Object.freeze(["collect sample", "survey area"]),
    "survey-first": Object.freeze(["survey area", "collect sample"])
  });

  function findPath(edges, source, sample) {
    const next = new Map();
    for (const edge of edges) {
      if (!next.has(edge.from)) next.set(edge.from, []);
      next.get(edge.from).push(edge.to);
    }
    const queue = [[source]], visited = new Set([source]);
    while (queue.length) {
      const path = queue.shift(), last = path[path.length - 1];
      if (last === sample) return path;
      for (const node of next.get(last) || []) {
        if (!visited.has(node)) { visited.add(node); queue.push([...path, node]); }
      }
    }
    return [];
  }

  function assess({
    sequence = "sample-first",
    sourcePresent = true,
    gloveContactsTool = true,
    toolContactsSample = true,
    isolationBoundary = false
  } = {}) {
    if (!Object.hasOwn(SEQUENCES, sequence)) throw new RangeError(`Unknown activity sequence: ${sequence}`);

    const source = "possible Earth-associated material";
    const glove = "EVA glove";
    const tool = "sample-contact interface";
    const sample = "rock core";
    const edges = [];
    if (sourcePresent) {
      edges.push({ from: source, to: glove, kind: "assumed source on glove" });
      if (gloveContactsTool && !isolationBoundary) {
        edges.push({ from: glove, to: tool, kind: "possible glove-to-tool contact transfer" });
      }
    }
    if (toolContactsSample) edges.push({ from: tool, to: sample, kind: "possible tool-to-sample contact transfer" });

    const path = sourcePresent ? findPath(edges, source, sample) : [];
    return Object.freeze({
      sequence,
      activityOrder: SEQUENCES[sequence],
      pathwayPresent: path.length > 0,
      path: Object.freeze(path),
      edges: Object.freeze(edges.map((edge) => Object.freeze(edge))),
      isolationBoundary,
      scope: "direct contact only; qualitative pathway reachability"
    });
  }

  return Object.freeze({ assess, sequences: SEQUENCES });
});
