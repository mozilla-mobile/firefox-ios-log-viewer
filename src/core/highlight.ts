import type { LogLine, Segment } from './types';

// Message-body hotspot rules, ported from the klogg highlighter set.
// Order matters only for building the combined regex; matches are non-overlapping.
const HOTSPOTS: { cls: string; src: string }[] = [
  {
    cls: 'hot-crash',
    src: 'parking_lot|make_client|get_current_device_id|0x8[bB][aA][dD][fF]00[dD]|watchdog',
  },
  {
    cls: 'hot-life',
    src: 'didFinishLaunchingWithOptions|scene did (?:become active|enter background)|applicationDid(?:BecomeActive|EnterBackground)|crashed at last launch',
  },
  {
    cls: 'hot-sync',
    src: 'RustSyncManager|AccountSyncHandler|sync_multiple|RustErrors|MozillaAppServices',
  },
  { cls: 'hot-tabs', src: 'preserving \\d+ tabs' },
];

const HOT_RE = new RegExp(HOTSPOTS.map((h) => `(${h.src})`).join('|'), 'g');

/// Split free text (a message body) into plain + hotspot-tagged segments.
function highlightMessage(text: string): Segment[] {
  const out: Segment[] = [];
  let last = 0;
  HOT_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = HOT_RE.exec(text)) !== null) {
    if (m.index > last) out.push({ text: text.slice(last, m.index), cls: 'msg' });
    // Group i+1 corresponds to HOTSPOTS[i].
    const groupIdx = m.slice(1).findIndex((g) => g !== undefined);
    out.push({ text: m[0], cls: HOTSPOTS[groupIdx]?.cls ?? 'msg' });
    last = m.index + m[0].length;
    if (m[0].length === 0) HOT_RE.lastIndex++; // guard against zero-width
  }
  if (last < text.length) out.push({ text: text.slice(last), cls: 'msg' });
  return out;
}

/// Produce the highlight segments for a whole line. Structured lines are split
/// into timestamp / level / [category] / component / message; unstructured
/// lines are treated as a message body (still hotspot-highlighted).
export function highlightSegments(line: LogLine): Segment[] {
  if (line.level === undefined || line.message === undefined) {
    return highlightMessage(line.raw);
  }
  const segs: Segment[] = [
    { text: line.timestamp ?? '', cls: 'tok-ts' },
    { text: ' ', cls: 'plain' },
    { text: line.level, cls: `tok-level tok-level-${line.level.toLowerCase()}` },
    { text: ' ', cls: 'plain' },
    { text: `[${line.category}]`, cls: 'tok-cat' },
    { text: ' ', cls: 'plain' },
    { text: line.component ?? '', cls: 'tok-comp' },
    { text: ' - ', cls: 'plain' },
    ...highlightMessage(line.message),
  ];
  return segs;
}

/// Overlay a case-insensitive search match onto existing segments, splitting
/// each segment so matched sub-slices gain the `search-hit` class. Matches that
/// span a segment boundary are highlighted per-segment (a minor visual seam).
export function applySearch(segments: Segment[], query: string): Segment[] {
  if (!query) return segments;
  const q = query.toLowerCase();
  const out: Segment[] = [];
  for (const seg of segments) {
    const lower = seg.text.toLowerCase();
    let from = 0;
    let hit = lower.indexOf(q, from);
    if (hit === -1) {
      out.push(seg);
      continue;
    }
    while (hit !== -1) {
      if (hit > from) out.push({ text: seg.text.slice(from, hit), cls: seg.cls });
      out.push({ text: seg.text.slice(hit, hit + q.length), cls: `${seg.cls} search-hit` });
      from = hit + q.length;
      hit = lower.indexOf(q, from);
    }
    if (from < seg.text.length) out.push({ text: seg.text.slice(from), cls: seg.cls });
  }
  return out;
}
