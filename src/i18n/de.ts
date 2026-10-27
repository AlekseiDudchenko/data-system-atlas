export default {
  "LIVE EXPERIMENT / 01": "INTERAKTIVES EXPERIMENT / 01",
  "One write. Three perspectives.": "Ein Schreibvorgang. Drei Perspektiven.",
  Step: "Schritt",
  "Write → read a follower → advance twice → read again. A write queues two messages; only advancing time delivers them.":
    "Schreiben → Replikat lesen → zwei Schritte weiter → erneut lesen. Ein Schreibvorgang stellt zwei Nachrichten in die Warteschlange; erst ein Zeitschritt stellt sie zu.",
  "Experiment controls": "Experimentsteuerung",
  "1 / Write to the leader": "1 / Auf den Leader schreiben",
  "Write value": "Wert schreiben",
  "Accepted immediately. Replication takes two steps.":
    "Sofort bestätigt. Die Replikation dauert zwei Schritte.",
  "2 / Read a replica": "2 / Ein Replikat lesen",
  "Follower A": "Replikat A",
  "Follower B": "Replikat B",
  "Read follower": "Replikat lesen",
  "A read does not advance time or deliver updates.":
    "Lesen bewegt die Zeit nicht weiter und stellt keine Updates zu.",
  "3 / Disrupt the network": "3 / Netzwerk unterbrechen",
  "Block follower": "Replikat blockieren",
  "Advance one step": "Einen Schritt weiter",
  "Reset experiment": "Experiment zurücksetzen",
  "Last read: Follower {0} returned “{1}” (v{2}). {3} — leader was v{4} at read time.":
    "Letzter Lesevorgang: Replikat {0} lieferte „{1}“ (v{2}). {3} — der Leader hatte beim Lesen v{4}.",
  "Stale read": "Veralteter Lesewert",
  "Current read": "Aktueller Lesewert",
  "No read yet. Predict the result, then read a follower.":
    "Noch kein Lesevorgang. Sagen Sie das Ergebnis voraus und lesen Sie ein Replikat.",
  "In transit": "Unterwegs",
  "FIFO per follower · delivery after two steps":
    "FIFO je Replikat · Zustellung nach zwei Schritten",
  "Leader →": "Leader →",
  "” · v": "” · v",
  "Blocked · retained": "Blockiert · gespeichert",
  "Ready next step": "Im nächsten Schritt bereit",
  "Due at step {0}": "Fällig bei Schritt {0}",
  "No pending messages.": "Keine ausstehenden Nachrichten.",
  "Event log": "Ereignisprotokoll",
  "Most recent first · last 100 events":
    "Neueste zuerst · letzte 100 Ereignisse",
  "New name": "New name",
  "LIVE EXPERIMENT / 02": "INTERAKTIVES EXPERIMENT / 02",
  "Your write. Your next read.":
    "Ihr Schreibvorgang. Ihr nächster Lesevorgang.",
  "Write → try an ordinary read → require your write → advance twice.":
    "Schreiben → sofort lesen → eigene Schreibversion anfordern → zwei Schritte weiter.",
  "Client:": "Client:",
  You: "Sie",
  "· Session minimum:": "· Sitzungsminimum:",
  v: "v",
  "1 / Update your profile name": "1 / Profilnamen ändern",
  "Write name": "Namen schreiben",
  "Each acknowledged write raises your session minimum. One client, one operation at a time.":
    "Jeder bestätigte Schreibvorgang erhöht das Sitzungsminimum. Ein Client, jeweils eine Operation.",
  "2 / Choose a follower": "2 / Replikat wählen",
  "Read immediately": "Sofort lesen",
  "Read my writes": "Eigene Schreibversion lesen",
  "Immediate reads may be old. Session reads wait for at least your last acknowledged write.":
    "Sofortiges Lesen kann alte Werte liefern. Sitzungslesen wartet mindestens auf Ihre letzte bestätigte Schreibversion.",
  "3 / Disrupt replication": "3 / Replikation unterbrechen",
  "Waiting on follower {0} for at least v{1}; it has v{2}. No value returned. Restore replication and advance time, or cancel this read.":
    "Warten auf Replikat {0} mit mindestens v{1}; es hat v{2}. Kein Wert zurückgegeben. Replikation wiederherstellen und Zeit vorwärts bewegen oder Lesen abbrechen.",
  "Session read": "Sitzungslesen",
  "Immediate read": "Sofortiges Lesen",
  "Older than the leader": "Älter als der Leader",
  "Current at completion": "Bei Abschluss aktuell",
  "No read yet. Predict which policy can return an old name.":
    "Noch kein Lesevorgang. Welche Strategie kann einen alten Namen liefern?",
  "Cancel waiting read": "Wartenden Lesevorgang abbrechen",
  "replication messages pending. Blocking a link retains its messages; restoring it delivers nothing until the next step. A waiting read stays on its chosen follower.":
    "Replikationsnachrichten ausstehend. Bei blockierter Verbindung bleiben Nachrichten erhalten; erst der nächste Schritt nach der Wiederherstellung stellt sie zu. Ein wartender Lesevorgang bleibt beim gewählten Replikat.",
  "No requests yet. Predict the distribution, then send a batch.":
    "Noch keine Anfragen. Verteilung vorhersagen, dann einen Stapel senden.",
  "Step {0}: {1} requests received, {2} completed, {3} queued. Busiest partition received {4}% of requests so far.":
    "Schritt {0}: {1} Anfragen empfangen, {2} abgeschlossen, {3} in der Warteschlange. Die meistbelastete Partition erhielt bisher {4}% der Anfragen.",
  "LIVE EXPERIMENT / 03": "INTERAKTIVES EXPERIMENT / 03",
  "Same keys. Different pressure.": "Gleiche Schlüssel. Andere Last.",
  "12 keys → 3 partitions. Routing: key modulo 3. Each partition completes up to":
    "12 Schlüssel → 3 Partitionen. Routing: Schlüssel modulo 3. Jede Partition bearbeitet bis zu",
  "equal-cost requests per step.": "gleich aufwendige Anfragen pro Schritt.",
  "1 / Choose a workload": "1 / Lastprofil wählen",
  "Even keys — one request per key": "Gleichmäßig — eine Anfrage je Schlüssel",
  "Hot key — nine requests to one key":
    "Hot Key — neun Anfragen an einen Schlüssel",
  "Changing workload or hot key starts a fresh run. The routing stays fixed.":
    "Ein anderes Lastprofil oder ein anderer Hot Key startet einen neuen Lauf. Das Routing bleibt gleich.",
  "2 / Choose the hot key": "2 / Hot Key wählen",
  Key: "Schlüssel",
  "→ P": "→ P",
  "Each batch: 9 × key {0}, plus keys {1}, {2}, {3} once each.":
    "Jeder Stapel: 9 × Schlüssel {0}, dazu die Schlüssel {1}, {2}, {3} jeweils einmal.",
  "Each batch: keys 0 through 11, once each.":
    "Jeder Stapel: Schlüssel 0 bis 11, jeweils einmal.",
  "Send 12 requests + step": "12 Anfragen senden + Schritt",
  "Drain one step": "Einen Schritt abarbeiten",
  "Reset run": "Lauf zurücksetzen",
  "A batch arrives first, then every partition serves its own queue. Drain adds no requests. Reset clears counters and keeps your choices.":
    "Zuerst trifft der Stapel ein, dann bedient jede Partition ihre Warteschlange. Abarbeiten fügt keine Anfragen hinzu. Zurücksetzen löscht Zähler und behält die Auswahl.",
  "Share of all requests received · fixed 0–100% scale":
    "Anteil aller empfangenen Anfragen · feste Skala 0–100%",
  queued: "wartend",
  "Exact counters and fixed key ownership":
    "Exakte Zähler und feste Schlüsselzuordnung",
  "Partition / keys": "Partition / Schlüssel",
  "Last step arrivals": "Eingänge im letzten Schritt",
  "Received total": "Insgesamt empfangen",
  "Completed total": "Insgesamt abgeschlossen",
  "Queued now": "Aktuell wartend",
  Keys: "Schlüssel",
  "The keys stay evenly placed: four per partition. Traffic can still be skewed. Queued work stays on its owner; spare capacity elsewhere is not borrowed.":
    "Die Schlüssel bleiben gleich verteilt: vier je Partition. Der Datenverkehr kann trotzdem ungleich sein. Wartende Arbeit bleibt beim Besitzer; freie Kapazität anderer Partitionen wird nicht genutzt.",
  "Leader version {0}. Follower A version {1}, {2}. Follower B version {3}, {4}.":
    "Leader Version {0}. Replikat A Version {1}, {2}. Replikat B Version {3}, {4}.",
  "× blocked": "× blockiert",
  blocked: "blockiert",
  connected: "verbunden",
  "LEADER · v": "LEADER · v",
  FOLLOWER: "REPLIKAT",
  "· v": "· v",
  "Full node values": "Vollständige Knotenwerte",
  "Leader:": "Leader:",
  Follower: "Replikat",
  behind: "im Rückstand",
  "caught up": "auf aktuellem Stand",
  "{0}: follower {1} returned “{2}” (v{3}). Required at least v{4}. {5} (leader v{6}). This result is historical.":
    "{0}: Replikat {1} lieferte „{2}“ (v{3}). Mindestens v{4} erforderlich. {5} (Leader v{6}). Dieses Ergebnis ist historisch.",
  "P{0}: {1} received, {2} completed, {3} queued":
    "P{0}: {1} empfangen, {2} abgeschlossen, {3} wartend",
  "Skip to content": "Zum Inhalt springen",
  Main: "Hauptnavigation",
  Language: "Sprache",
  "Explore the atlas": "Atlas entdecken",
  "Explore. Break. Understand.": "Entdecken. Verändern. Verstehen.",
  "An independent, open-source learning project.":
    "Ein unabhängiges Lernprojekt mit offenem Quellcode.",
  "A FIELD GUIDE TO DATA SYSTEMS": "EIN WEGWEISER FÜR DATENSYSTEME",
  "Understand the system.": "Das System verstehen.",
  "By changing it.": "Indem Sie es verändern.",
  "Make a write. Cut a connection. Read an old value. Explore the trade-offs behind the systems you build, one experiment at a time.":
    "Schreiben Sie einen Wert. Trennen Sie eine Verbindung. Lesen Sie einen alten Wert. Entdecken Sie die Abwägungen hinter Ihren Systemen — Experiment für Experiment.",
  "Start with replication": "Mit Replikation beginnen",
  "03 interactive lessons · Built for curious engineers":
    "03 interaktive Lektionen · Für neugierige Engineers",
  "Your map of data systems": "Ihre Karte der Datensysteme",
  "Eight territories. One connected view.": "Acht Gebiete. Ein Gesamtbild.",
  Foundations: "Grundlagen",
  "Storage Engines": "Speicher-Engines",
  Replication: "Replikation",
  Partitioning: "Partitionierung",
  "Transactions & Consistency": "Transaktionen & Konsistenz",
  "Distributed Coordination": "Verteilte Koordination",
  "Event-Driven Systems": "Ereignisgesteuerte Systeme",
  "Architecture Patterns": "Architekturmuster",
  "EXPLORE NOW": "JETZT ENTDECKEN",
  "ON THE HORIZON": "IN PLANUNG",
  "When a successful write and an old read can both be correct.":
    "Wenn ein bestätigter Schreibvorgang und ein alter Lesewert beide korrekt sein können.",
  "Replication and Stale Reads": "Replikation und veraltete Lesewerte",
  "Read Your Writes": "Eigene Schreibvorgänge lesen",
  "Evenly placed keys can still produce uneven traffic.":
    "Gleich verteilte Schlüssel können trotzdem ungleichen Datenverkehr erzeugen.",
  "Partitioning and Hotspots": "Partitionierung und Hotspots",
  "Planned territory": "Geplantes Gebiet",
  Atlas: "Atlas",
  "EXPERIMENT {0} · ABOUT 10 MINUTES": "EXPERIMENT {0} · ETWA 10 MINUTEN",
  "This experiment needs JavaScript. The explanation and worked scenario below are available without it.":
    "Dieses Experiment benötigt JavaScript. Die Erklärung und das Beispiel darunter sind auch ohne JavaScript verfügbar.",
  "Explore, break, and understand data systems through original interactive experiments.":
    "Datensysteme durch eigenständige interaktive Experimente entdecken, verändern und verstehen.",
  "Step {0} · {1}": "Schritt {0} · {1}",
  "All replicas begin at v0: “{0}”.": "Alle Replikate starten bei v0: „{0}“.",
  "Leader accepted v{0}: “{1}”. Two updates queued.":
    "Leader bestätigte v{0}: „{1}“. Zwei Updates eingereiht.",
  "Read follower {0}: “{1}” (v{2}) — {3} at read time.":
    "Replikat {0} gelesen: „{1}“ (v{2}) — {3} zum Lesezeitpunkt.",
  "Replication to {0} {1}. Queued updates are retained.":
    "Replikation zu {0}: {1}. Eingereihte Updates bleiben erhalten.",
  restored: "wiederhergestellt",
  "Delivered {0} update(s), in write order per follower.":
    "{0} Updates zugestellt, je Replikat in Schreibreihenfolge.",
  "No updates delivered. Links may be blocked or messages are not due yet.":
    "Keine Updates zugestellt. Verbindungen können blockiert sein oder Nachrichten sind noch nicht fällig.",
} as const;
