export type NestedObject = Record<string, unknown>;

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function nestedObjectToDotNotatedPaths(
  obj: NestedObject,
  prefix = "",
): Record<string, unknown> {
  const entries: [string, unknown][] = [];

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
          entries.push(...Object.entries(flattened));
        } else {
          entries.push([arrayKey, item]);
        }
      });
    } else if (isObject(value)) {
      const flattened = nestedObjectToDotNotatedPaths(value, newKey);
      entries.push(...Object.entries(flattened));
    } else {
      entries.push([newKey, value]);
    }
  }

  return Object.fromEntries(entries);
}
