export type UnitPreference = "imperial" | "metric";

const POUNDS_PER_KILOGRAM = 2.2046226218;

export function getWeightUnitLabel(unitPreference: UnitPreference): string {
  return unitPreference === "imperial" ? "lb" : "kg";
}

export function convertWeightKgToUnit(
  weightKg: number,
  unitPreference: UnitPreference
): number {
  return unitPreference === "imperial" ? weightKg * POUNDS_PER_KILOGRAM : weightKg;
}

export function convertWeightUnitToKg(
  weightValue: number,
  unitPreference: UnitPreference
): number {
  return unitPreference === "imperial" ? weightValue / POUNDS_PER_KILOGRAM : weightValue;
}

export function formatWeightValue(
  weightKg: number,
  unitPreference: UnitPreference,
  fractionDigits: number = 1
): string {
  return convertWeightKgToUnit(weightKg, unitPreference).toFixed(fractionDigits);
}

export function formatWeight(
  weightKg: number,
  unitPreference: UnitPreference,
  fractionDigits: number = 1
): string {
  return `${formatWeightValue(weightKg, unitPreference, fractionDigits)} ${getWeightUnitLabel(unitPreference)}`;
}