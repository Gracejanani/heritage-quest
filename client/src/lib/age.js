export function calculateAge(dob, today = new Date()) {
  if (!dob) return null;
  const birth = new Date(`${dob}T00:00:00`);
  if (Number.isNaN(birth.getTime())) return null;

  let age = today.getFullYear() - birth.getFullYear();
  const month = today.getMonth() - birth.getMonth();
  if (month < 0 || (month === 0 && today.getDate() < birth.getDate())) age -= 1;
  return age;
}

export function getAgeGroupFromAge(age) {
  if (!Number.isFinite(age) || age < 1) return "entry";
  if (age <= 5) return "entry";
  if (age <= 9) return "junior";
  if (age <= 16) return "scholar";
  return "open";
}

export function getAgeGroup(dob) {
  return getAgeGroupFromAge(calculateAge(dob));
}

export const AGE_GROUPS = {
  entry: {
    label: "Little Explorer",
    range: "Ages 1–5",
    description: "Simple recognition and beginner heritage questions.",
  },
  junior: {
    label: "Young Explorer",
    range: "Ages 6–9",
    description: "Clear factual and medium-level heritage questions.",
  },
  scholar: {
    label: "Heritage Scholar",
    range: "Ages 10–16",
    description: "A mix of medium and advanced heritage questions.",
  },
  open: {
    label: "Open Explorer",
    range: "Age 17+",
    description: "The full medium and advanced question set.",
  },
};
