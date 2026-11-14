/* Deterministic, event-based possible-contact provenance. No material amount or
 * physical transfer is asserted; every graph edge comes from a stated scenario assumption. */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.ContactHistoryModel = api;
})(globalThis, function () {
  const KNOWN_TYPES = new Set(["contact", "seal", "reopen", "document-control"]);
  const SEAL_INTEGRITY = new Set(["checked", "unchecked"]);

  function requireReference(collection, id, what) {
    if (!Object.hasOwn(collection, id)) throw new TypeError(`Unknown ${what}: ${id}`);
  }

  function validate(scenario) {
    if (!scenario || !scenario.places || !scenario.sources || !scenario.objects || !Array.isArray(scenario.events)) {
      throw new TypeError("Scenario must define places, sources, objects, and an ordered events array");
    }
    if (!scenario.sampleId) throw new TypeError("Scenario must identify its sample object");
    requireReference(scenario.objects, scenario.sampleId, "sample object");
    const ids = new Set();
    let previousOrder = 0;
    for (const event of scenario.events) {
      if (!event.id || ids.has(event.id)) throw new TypeError(`Missing or duplicate event id: ${event.id}`);
      ids.add(event.id);
      if (!Number.isInteger(event.order) || event.order !== previousOrder + 1) {
        throw new RangeError(`Ambiguous event order at ${event.id}; order must be unique and contiguous from 1`);
      }
      previousOrder = event.order;
      requireReference(scenario.places, event.placeId, `place in event ${event.id}`);
      if (!KNOWN_TYPES.has(event.type)) throw new TypeError(`Unknown event type in ${event.id}: ${event.type}`);
      if (!Array.isArray(event.participants)) throw new TypeError(`Event ${event.id} must list participants`);
      for (const id of event.participants) {
        if (!Object.hasOwn(scenario.objects, id) && !Object.hasOwn(scenario.sources, id)) {
          throw new TypeError(`Unknown participant in ${event.id}: ${id}`);
        }
      }
      const contacts = event.contacts || [];
      if (!Array.isArray(contacts)) throw new TypeError(`Event ${event.id} contacts must be an array`);
      if (event.type !== "contact" && contacts.length) throw new TypeError(`${event.type} event ${event.id} cannot add contacts`);
      for (const contact of contacts) {
        const knownNode = (id) => Object.hasOwn(scenario.objects, id) || Object.hasOwn(scenario.sources, id);
        if (!knownNode(contact.from)) throw new TypeError(`Unknown contact source in ${event.id}: ${contact.from}`);
        if (!knownNode(contact.to)) throw new TypeError(`Unknown contact target in ${event.id}: ${contact.to}`);
        if (!event.participants.includes(contact.from) || !event.participants.includes(contact.to)) {
          throw new TypeError(`Contact endpoints must be listed as participants in ${event.id}`);
        }
        if (!["forward", "bidirectional"].includes(contact.direction)) throw new TypeError(`Contact direction must be explicit in ${event.id}`);
        if (typeof contact.assumption !== "string" || !contact.assumption.trim()) {
          throw new TypeError(`Contact assumption is required in ${event.id}`);
        }
      }
      if (event.integrity !== undefined && (event.type !== "seal" || !SEAL_INTEGRITY.has(event.integrity))) {
        throw new TypeError(`Seal integrity in ${event.id} must be "checked" or "unchecked" on a seal event`);
      }
      if (event.tag !== undefined && (typeof event.tag !== "string" || !event.tag.trim())) {
        throw new TypeError(`Event tag in ${event.id} must be a non-empty string`);
      }
    }
    validatePlanning(scenario);
  }

  /* Optional planning records. They describe where a team wants to keep objects apart; they never
   * create or remove a contact edge. */
  function validatePlanning(scenario) {
    for (const placeId of scenario.route || []) requireReference(scenario.places, placeId, "route place");
    const zoneIds = new Set();
    for (const zone of scenario.zones || []) {
      if (!zone.id || zoneIds.has(zone.id)) throw new TypeError(`Missing or duplicate zone id: ${zone.id}`);
      zoneIds.add(zone.id);
      requireReference(scenario.places, zone.centerPlaceId, `centre place of zone ${zone.id}`);
      if (!Array.isArray(zone.placeIds)) throw new TypeError(`Zone ${zone.id} must list the places inside it`);
      for (const placeId of zone.placeIds) requireReference(scenario.places, placeId, `place in zone ${zone.id}`);
    }
    const ruleIds = new Set();
    for (const rule of scenario.rules || []) {
      if (!rule.id || ruleIds.has(rule.id)) throw new TypeError(`Missing or duplicate rule id: ${rule.id}`);
      ruleIds.add(rule.id);
      if (rule.kind !== "keep-out") throw new TypeError(`Unknown rule kind in ${rule.id}: ${rule.kind}`);
      if (!zoneIds.has(rule.zoneId)) throw new TypeError(`Unknown zone in rule ${rule.id}: ${rule.zoneId}`);
      if (!Array.isArray(rule.objectIds)) throw new TypeError(`Rule ${rule.id} must list object IDs`);
      for (const objectId of rule.objectIds) requireReference(scenario.objects, objectId, `object in rule ${rule.id}`);
    }
  }

  /* A keep-out rule is broken when a contact event at a place inside the rule's zone lists one of
   * the rule's objects as a participant. The result is a warning only. */
  function ruleWarningsFor(scenario, event) {
    if (event.type !== "contact") return [];
    const warnings = [];
    for (const rule of scenario.rules || []) {
      const zone = scenario.zones.find((item) => item.id === rule.zoneId);
      if (!zone.placeIds.includes(event.placeId)) continue;
      for (const objectId of rule.objectIds) {
        if (event.participants.includes(objectId)) {
          warnings.push({ ruleId: rule.id, zoneId: zone.id, eventId: event.id, order: event.order, placeId: event.placeId, objectId });
        }
      }
    }
    return warnings;
  }

  function replay(scenario, through = scenario.events.length) {
    validate(scenario);
    if (!Number.isInteger(through) || through < 0 || through > scenario.events.length) {
      throw new RangeError("Event prefix is outside the scenario timeline");
    }
    const adjacency = new Map();
    const sealed = new Set();
    const frozenHistory = new Map();
    const snapshots = [];
    const graphEdges = [];
    const seals = {};
    const records = [];
    const ruleWarnings = [];
    const addEdge = (from, to, event, contact) => {
      const edge = {
        from,
        to,
        eventId: event ? event.id : null,
        order: event ? event.order : 0,
        placeId: event ? event.placeId : null,
        assumption: contact.assumption,
        direction: contact.direction,
        type: event ? "contact" : "declared-start-history"
      };
      if (!adjacency.has(from)) adjacency.set(from, []);
      adjacency.get(from).push(edge);
      graphEdges.push(edge);
    };

    for (const [objectId, object] of Object.entries(scenario.objects)) {
      const initial = object.startHistory || [];
      if (!Array.isArray(initial)) throw new TypeError(`Starting history for ${objectId} must be an array`);
      for (const entry of initial) {
        requireReference(scenario.sources, entry.sourceId, `starting source for ${objectId}`);
        if (!entry.assumption || !String(entry.assumption).trim()) throw new TypeError(`Starting history for ${objectId} needs an assumption`);
        addEdge(entry.sourceId, objectId, null, { ...entry, direction: "forward" });
      }
    }

    const pathsFrom = (sourceId) => {
      const paths = new Map([[sourceId, []]]);
      const queue = [sourceId];
      while (queue.length) {
        const from = queue.shift();
        for (const edge of adjacency.get(from) || []) {
          if (paths.has(edge.to)) continue;
          paths.set(edge.to, [...paths.get(from), edge]);
          queue.push(edge.to);
        }
      }
      return paths;
    };
    const historyFor = (objectId) => {
      if (frozenHistory.has(objectId) && sealed.has(objectId)) return frozenHistory.get(objectId);
      const histories = [];
      for (const sourceId of Object.keys(scenario.sources)) {
        const path = pathsFrom(sourceId).get(objectId);
        if (path) histories.push({ sourceId, path });
      }
      return histories;
    };
    const takeSnapshot = (eventId = null) => {
      const histories = {};
      for (const objectId of Object.keys(scenario.objects)) histories[objectId] = historyFor(objectId);
      snapshots.push({ eventId, histories, sealed: [...sealed] });
    };

    for (const event of scenario.events.slice(0, through)) {
      if (event.type === "seal") {
        const sampleIds = event.participants.filter((id) => scenario.objects[id]?.kind === "sample");
        if (sampleIds.length !== 1) throw new TypeError(`Seal event ${event.id} must name exactly one sample`);
        const sampleId = sampleIds[0];
        if (sealed.has(sampleId)) throw new TypeError(`Sample ${sampleId} is already sealed`);
        frozenHistory.set(sampleId, historyFor(sampleId));
        sealed.add(sampleId);
        // Seal integrity is a recorded status. It changes no edge and no frozen history.
        seals[sampleId] = { eventId: event.id, order: event.order, placeId: event.placeId, integrity: event.integrity || null };
      } else if (event.type === "reopen") {
        const sampleIds = event.participants.filter((id) => scenario.objects[id]?.kind === "sample");
        if (sampleIds.length !== 1) throw new TypeError(`Reopen event ${event.id} must name exactly one sample`);
        if (!sealed.has(sampleIds[0])) throw new TypeError(`Sample ${sampleIds[0]} is not sealed`);
        sealed.delete(sampleIds[0]);
        delete seals[sampleIds[0]];
      } else if (event.type === "contact") {
        ruleWarnings.push(...ruleWarningsFor(scenario, event));
        for (const objectId of event.participants.filter((id) => scenario.objects[id])) {
          if (sealed.has(objectId)) throw new TypeError(`Event ${event.id} touches sealed object ${objectId}; add an explicit reopen event first`);
        }
        for (const contact of event.contacts || []) {
          addEdge(contact.from, contact.to, event, contact);
          if (contact.direction === "bidirectional") addEdge(contact.to, contact.from, event, contact);
        }
      }
      // document-control events add a dated-by-order record only; no edge is removed or added.
      if (event.type === "document-control") {
        records.push({ eventId: event.id, order: event.order, placeId: event.placeId, tag: event.tag || null, participants: [...event.participants] });
      }
      takeSnapshot(event.id);
    }

    const latest = snapshots.at(-1) || { histories: {}, sealed: [] };
    return Object.freeze({
      scenarioId: scenario.id,
      eventCount: through,
      events: scenario.events.slice(0, through),
      snapshots,
      histories: latest.histories,
      graphEdges,
      sampleId: scenario.sampleId,
      sampleHistory: latest.histories[scenario.sampleId] || [],
      sampleSealed: latest.sealed.includes(scenario.sampleId),
      seals,
      records,
      ruleWarnings
    });
  }

  return Object.freeze({ replay, validate });
});
