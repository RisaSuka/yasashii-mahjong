export const tests = [];

export class NotImplementedError extends Error {
  constructor(message) {
    super(message);
    this.name = "NotImplementedError";
  }
}

export function test(name, fn) {
  tests.push({ name, fn });
}

export function assertTrue(value, message = "Expected value to be truthy") {
  if (!value) {
    throw new Error(message);
  }
}

export function assertEqual(actual, expected, message = "Expected values to be equal") {
  if (!Object.is(actual, expected)) {
    throw new Error(`${message}. Expected ${formatValue(expected)}, got ${formatValue(actual)}`);
  }
}

export function assertDeepEqual(actual, expected, message = "Expected values to be deeply equal") {
  const actualJson = JSON.stringify(actual);
  const expectedJson = JSON.stringify(expected);

  if (actualJson !== expectedJson) {
    throw new Error(`${message}. Expected ${expectedJson}, got ${actualJson}`);
  }
}

export async function loadModule(path, expectedExports = []) {
  let module;

  try {
    module = await import(path);
  } catch (error) {
    throw new NotImplementedError(`未実装: ${path} を読み込めません。${error.message}`);
  }

  for (const exportName of expectedExports) {
    if (!(exportName in module)) {
      throw new NotImplementedError(`未実装: ${path} に ${exportName} export が必要です。`);
    }
  }

  return module;
}

export async function runTests() {
  const results = [];

  for (const { name, fn } of tests) {
    try {
      await fn();
      results.push({ name, status: "pass", message: "" });
    } catch (error) {
      const isPending = error instanceof NotImplementedError;
      results.push({
        name,
        status: isPending ? "pending" : "fail",
        message: error.stack || error.message || String(error)
      });
    }
  }

  return results;
}

function formatValue(value) {
  return typeof value === "string" ? `"${value}"` : JSON.stringify(value);
}
