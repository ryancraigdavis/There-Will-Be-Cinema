export function frameDt(delta: number, fixedStepMs: number | null): number {
  return fixedStepMs ? fixedStepMs / 1000 : delta
}
