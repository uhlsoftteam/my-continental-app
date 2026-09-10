export interface PatientDemographics {
  dob?: string;
  gender?: string; // "Male", "Female", "M", "F", "1", "2"
}

export function calculateAgeInYears(dob?: string): number | null {
  if (!dob) return null;
  let birthDate = new Date(dob);

  if (isNaN(birthDate.getTime())) {
    // try dd-mm-yyyy or dd/mm/yyyy
    const parts = dob.match(/^(\d{2})[-/](\d{2})[-/](\d{4})/);
    if (parts) {
      const [_, day, month, year] = parts;
      birthDate = new Date(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10));
    }
  }

  if (isNaN(birthDate.getTime())) return null;

  const diff = Date.now() - birthDate.getTime();
  return diff / (1000 * 60 * 60 * 24 * 365.25);
}

function normalizeGender(gender?: string): "M" | "F" | "O" {
  if (!gender) return "O";
  const g = String(gender).toLowerCase();
  if (g.startsWith("m") || g === "1") return "M";
  if (g.startsWith("f") || g === "2") return "F";
  return "O";
}

/**
 * Returns [min, max] safe range for a test based on user demographics.
 * Returns null if no safe range logic is defined for the test.
 */
export function getSafeRange(
  testCode: string | number,
  patient: PatientDemographics
): [number, number] | null {
  const code = Number(testCode);
  const age = calculateAgeInYears(patient.dob);
  const gender = normalizeGender(patient.gender);

  switch (code) {
    case 600000336: // Haemoglobin
      if (age !== null) {
        if (age <= 0.083) return [14.0, 22.0]; // <= 1 month (Newborn)
        if (age < 2) return [11.1, 14.1]; // Infant to 1 Year
        // Child > 2 yrs falls back to adult range in this mapping
      }
      return gender === "F" ? [11.5, 16.5] : [13.0, 18.0];

    case 600000339: // Platelets Count
      if (age !== null && age <= 0.083) {
        return [84, 478]; // Newborn
      }
      return [150, 450]; // Default adult / child

    case 600000216: // LDL - Cholesterol
      return [0, 100]; // Optimal

    case 600000214: // Cholesterol (Total)
      return [0, 200]; // Desirable

    case 600000191: // HbA1c
      return [4.00, 6.40];

    case 600000199: // Serum Creatinine
      if (age !== null) {
        if (age < 1) return [0.16, 0.39]; // Infant
        if (age < 12) return [0.26, 0.77]; // Child
      }
      return gender === "F" ? [0.57, 1.11] : [0.72, 1.25];

    default:
      return null;
  }
}
