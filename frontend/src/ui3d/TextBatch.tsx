import { useEffect, useMemo } from 'react'
import { BatchedText, Text } from 'troika-three-text'
import type { TextSpec } from '../store/signText'

function member(spec: TextSpec): Text {
  const text = new Text()
  Object.assign(text, {
    text: spec.text,
    font: spec.font,
    fontSize: spec.fontSize,
    letterSpacing: spec.letterSpacing,
    maxWidth: spec.maxWidth,
    textAlign: spec.textAlign,
    anchorX: spec.anchorX,
    anchorY: spec.anchorY,
    color: spec.color,
  })
  text.position.set(...spec.position)
  text.rotation.set(0, spec.yaw, 0)
  return text
}

export function buildTextBatch(specs: readonly TextSpec[]): {
  batch: BatchedText
  members: Text[]
} {
  const batch = new BatchedText()
  const members = specs.map(member)
  for (const text of members) {
    batch.addText(text)
  }
  batch.sync()
  return { batch, members }
}

export function TextBatch({ specs, name }: { specs: readonly TextSpec[]; name: string }) {
  const built = useMemo(() => buildTextBatch(specs), [specs])
  useEffect(
    () => () => {
      built.batch.dispose()
      for (const text of built.members) {
        text.dispose()
      }
    },
    [built],
  )
  return <primitive object={built.batch} name={name} />
}
