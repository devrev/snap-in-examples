/** Anti try-catch, Go-like (res, err) convenience functions */

export function tryGet<T>(getter: () => T): { ok: true; value: T } | { ok: false; error: string } {
  try {
    return {
      ok: true,
      value: getter(),
    };
  } catch (error) {
    return {
      error: error as string,
      ok: false,
    };
  }
}

export async function tryGetAsync<T>(
  getter: () => Promise<T>
): Promise<{ ok: true; value: T } | { ok: false; error: string }> {
  try {
    return {
      ok: true,
      value: await getter(),
    };
  } catch (error) {
    return {
      error: error as string,
      ok: false,
    };
  }
}
