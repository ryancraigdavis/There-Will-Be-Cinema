export async function requestLock(element: HTMLElement | null): Promise<boolean> {
  try {
    await element?.requestPointerLock()
    return document.pointerLockElement === element && element !== null
  } catch {
    return false
  }
}

export function releaseLock(): void {
  if (document.pointerLockElement) {
    document.exitPointerLock()
  }
}
