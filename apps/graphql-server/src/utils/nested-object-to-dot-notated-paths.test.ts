import { describe, expect, it } from "vitest";
import { nestedObjectToDotNotatedPaths } from "./nested-object-to-dot-notated-paths.js";

describe("nestedObjectToDotNotatedPaths", () => {
  it("should handle simple flat objects unchanged", () => {
    const input = {
      a: "hello",
      b: "world",
      c: 123,
    };

    const result = nestedObjectToDotNotatedPaths(input);

    expect(result).toEqual({
      a: "hello",
      b: "world",
      c: 123,
    });
  });

  it("should flatten nested objects with dot notation", () => {
    const input = {
      a: "hello",
      b: {
        c: "world",
      },
    };

    const result = nestedObjectToDotNotatedPaths(input);

    expect(result).toEqual({
      a: "hello",
      "b.c": "world",
    });
  });

  it("should flatten arrays with 1-based bracket notation", () => {
    const input = {
      d: [{ e: "value" }, { e: "test" }],
    };

    const result = nestedObjectToDotNotatedPaths(input);

    expect(result).toEqual({
      "d.[1].e": "value",
      "d.[2].e": "test",
    });
  });

  it("should handle the complete example from requirements", () => {
    const input = {
      a: "hello",
      b: {
        c: "world",
      },
      d: [{ e: "value" }, { e: "test" }],
    };

    const result = nestedObjectToDotNotatedPaths(input);

    expect(result).toEqual({
      a: "hello",
      "b.c": "world",
      "d.[1].e": "value",
      "d.[2].e": "test",
    });
  });

  it("should handle deeply nested objects", () => {
    const input = {
      a: {
        b: {
          c: {
            d: "deep",
          },
        },
      },
    };

    const result = nestedObjectToDotNotatedPaths(input);

    expect(result).toEqual({
      "a.b.c.d": "deep",
    });
  });

  it("should handle mixed nested structures", () => {
    const input = {
      user: {
        name: "John",
        address: {
          city: "NYC",
        },
      },
      items: [{ id: 1 }, { id: 2 }],
    };

    const result = nestedObjectToDotNotatedPaths(input);

    expect(result).toEqual({
      "user.name": "John",
      "user.address.city": "NYC",
      "items.[1].id": 1,
      "items.[2].id": 2,
    });
  });

  it("should handle arrays with nested objects", () => {
    const input = {
      data: [
        {
          user: {
            name: "Alice",
          },
        },
        {
          user: {
            name: "Bob",
          },
        },
      ],
    };

    const result = nestedObjectToDotNotatedPaths(input);

    expect(result).toEqual({
      "data.[1].user.name": "Alice",
      "data.[2].user.name": "Bob",
    });
  });

  it("should handle empty objects", () => {
    const input = {};

    const result = nestedObjectToDotNotatedPaths(input);

    expect(result).toEqual({});
  });

  it("should handle empty arrays", () => {
    const input = {
      items: [],
    };

    const result = nestedObjectToDotNotatedPaths(input);

    expect(result).toEqual({});
  });

  it("should handle null values", () => {
    const input = {
      a: null,
      b: {
        c: null,
      },
    };

    const result = nestedObjectToDotNotatedPaths(input);

    expect(result).toEqual({
      a: null,
      "b.c": null,
    });
  });

  it("should handle undefined values", () => {
    const input = {
      a: undefined,
      b: {
        c: undefined,
      },
    };

    const result = nestedObjectToDotNotatedPaths(input);

    expect(result).toEqual({
      a: undefined,
      "b.c": undefined,
    });
  });

  it("should handle boolean values", () => {
    const input = {
      a: true,
      b: {
        c: false,
      },
    };

    const result = nestedObjectToDotNotatedPaths(input);

    expect(result).toEqual({
      a: true,
      "b.c": false,
    });
  });

  it("should handle arrays with primitive values", () => {
    const input = {
      numbers: [1, 2, 3],
      strings: ["a", "b"],
    };

    const result = nestedObjectToDotNotatedPaths(input);

    expect(result).toEqual({
      "numbers.[1]": 1,
      "numbers.[2]": 2,
      "numbers.[3]": 3,
      "strings.[1]": "a",
      "strings.[2]": "b",
    });
  });

  it("should handle objects with numeric keys", () => {
    const input = {
      a: "test",
      1: "numeric",
    };

    const result = nestedObjectToDotNotatedPaths(input);

    expect(result).toEqual({
      a: "test",
      "1": "numeric",
    });
  });
});
