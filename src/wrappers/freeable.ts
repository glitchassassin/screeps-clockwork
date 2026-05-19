export interface FreeableWasmHandle {
  free(): void;
}

export function assertNotFreed<T>(handle: T | undefined, label: string): T {
  if (!handle) {
    throw new Error(`${label} has been freed`);
  }
  return handle;
}

export function freeHandle<T extends FreeableWasmHandle>(handle: T | undefined): undefined {
  handle?.free();
  return undefined;
}
