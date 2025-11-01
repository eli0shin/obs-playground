export type NestedObject = Record<string, unknown>;

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function nestedObjectToDotNotatedPaths(
  obj: NestedObject,
  prefix = "",
): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    const newKey = prefix ? `${prefix}.${key}` : key;

    if (Array.isArray(value)) {
      if (value.length === 0) {
        continue;
      }

      value.forEach((item, index) => {
        const arrayKey = `${newKey}.[${index + 1}]`;

        if (isObject(item)) {
          const flattened = nestedObjectToDotNotatedPaths(item, arrayKey);
          Object.assign(result, flattened);
        } else {
          result[arrayKey] = item;
        }
      });
    } else if (isObject(value)) {
      const flattened = nestedObjectToDotNotatedPaths(value, newKey);
      Object.assign(result, flattened);
    } else {
      result[newKey] = value;
    }
  }

  return result;
}
