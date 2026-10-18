
const SEVERITY_LEVELS = {
  low: 1,
  medium: 2,
  high: 3,
};

const CATEGORY_RULES = {
  pothole: {
    high: ["deep", "large", "dangerous", "major", "accident"],
    medium: ["crack", "damaged", "broken"],
  },
  road: {
    high: ["deep", "large", "dangerous", "major", "accident", "cave-in", "collapse"],
    medium: ["crack", "damaged", "broken", "uneven"],
  },
  road_damage: {
    high: ["deep", "large", "dangerous", "major", "accident", "cave-in", "collapse"],
    medium: ["crack", "damaged", "broken", "uneven"],
  },
  water: {
    high: ["flooded", "impassable", "deep water", "submerged"],
    medium: ["waterlogged", "standing water", "overflow"],
  },
  waterlogging: {
    high: ["flooded", "impassable", "deep water", "submerged"],
    medium: ["waterlogged", "standing water", "overflow"],
  },
  drain: {
    high: ["open manhole", "uncovered manhole", "missing cover", "open drain", "hazardous"],
    medium: ["damaged manhole", "broken grate", "clogged"],
  },
  open_manhole: {
    high: ["open manhole", "uncovered manhole", "missing cover", "open drain", "hazardous"],
    medium: ["damaged manhole", "broken grate", "clogged"],
  },
  light: {
    high: ["live wire", "electric shock", "exposed wire", "sparking"],
    medium: ["broken", "not working", "dark", "flickering"],
  },
  streetlight: {
    high: ["live wire", "electric shock", "exposed wire", "sparking"],
    medium: ["broken", "not working", "dark", "flickering"],
  },
  signal: {
    high: ["blackout", "traffic jam", "accident risk", "all signals off"],
    medium: ["stuck", "timer broken", "not changing", "blinking yellow"],
  },
  footpath: {
    high: ["collapsed", "major ditch", "trip hazard", "sinkhole"],
    medium: ["broken paver", "cracked", "blocked"],
  },
};

const HIGH_RISK_TERMS = [
  "injury",
  "accident",
  "life threatening",
  "live wire",
  "exposed wire",
  "blocked emergency access",
];

export function assessSeverity({
  category = "",
  title = "",
  description = "",
  citizenSeverity = null,
} = {}) {
  const text = `${title} ${description}`.toLowerCase();
  const rules = CATEGORY_RULES[category.toLowerCase()] || {
    high: ["life threatening", "accident", "dangerous"],
    medium: ["damaged", "broken", "blocked"],
  };

  const reasons = [];
  let score = 1;

  if (rules.high.some((term) => text.includes(term))) {
    score = 3;
    reasons.push("A high-risk hazard indicator was reported.");
  } else if (rules.medium.some((term) => text.includes(term))) {
    score = 2;
    reasons.push("A moderate-damage indicator was reported.");
  }

  if (HIGH_RISK_TERMS.some((term) => text.includes(term))) {
    score = 3;
    reasons.push("The description contains a potential safety risk.");
  }

  const selected = SEVERITY_LEVELS[citizenSeverity];

  if (selected && selected > score) {
    score = selected;
    reasons.push("Citizen-selected severity was retained as a precaution.");
  }

  const severity =
    Object.keys(SEVERITY_LEVELS).find(
      (level) => SEVERITY_LEVELS[level] === score
    ) || "medium";

  const needsHumanReview =
    reasons.length === 0 ||
    (citizenSeverity && selected !== score);

  return {
    severity,
    needsHumanReview,
    assessmentMethod: "transparent_rules_v1",
    reasons:
      reasons.length > 0
        ? reasons
        : ["Insufficient hazard indicators; manual review is recommended."],
  };
}
