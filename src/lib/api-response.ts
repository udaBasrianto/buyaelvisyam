type AnyRecord = Record<string, unknown>;

const isPlainObject = (value: unknown): value is AnyRecord =>
  !!value && typeof value === "object" && !Array.isArray(value);

export const asArray = <T,>(value: unknown): T[] => {
  if (Array.isArray(value)) return value as T[];
  if (isPlainObject(value)) {
    for (const key of ["data", "items", "results", "rows", "list"]) {
      if (key in value) {
        const nested = asArray<T>(value[key]);
        if (nested.length > 0) return nested;
      }
    }
  }
  return [];
};

export const asObject = <T extends AnyRecord>(value: unknown, fallback: T): T => {
  if (isPlainObject(value)) {
    for (const key of ["data", "item", "result"]) {
      if (key in value && isPlainObject(value[key])) {
        return asObject(value[key], fallback);
      }
    }
    return value as T;
  }
  return fallback;
};

export const asNumber = (value: unknown, fallback = 0): number => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
};
