export const WCA_EVENT_OPTIONS = [
  { id: "222", label: "2x2x2" },
  { id: "333", label: "3x3x3" },
  { id: "444", label: "4x4x4" },
  { id: "555", label: "5x5x5" },
  { id: "666", label: "6x6x6" },
  { id: "777", label: "7x7x7" },
  { id: "333bf", label: "3x3x3 Blindfolded" },
  { id: "333fm", label: "3x3x3 Fewest Moves" },
  { id: "333oh", label: "3x3x3 One-Handed" },
  { id: "clock", label: "Clock" },
  { id: "minx", label: "Megaminx" },
  { id: "pyram", label: "Pyraminx" },
  { id: "skewb", label: "Skewb" },
  { id: "sq1", label: "Square-1" },
  { id: "444bf", label: "4x4x4 Blindfolded" },
  { id: "555bf", label: "5x5x5 Blindfolded" },
  { id: "333mbf", label: "3x3x3 Multi-Blind" },
] as const;

export const WCA_EVENT_NAME_MAP = Object.fromEntries(
  WCA_EVENT_OPTIONS.map((event) => [event.id, event.label]),
) as Record<(typeof WCA_EVENT_OPTIONS)[number]["id"], string>;

export const WCA_EVENT_ID_SET = new Set(WCA_EVENT_OPTIONS.map((event) => event.id));
