import type { ComponentType } from 'react'
import { AccountCard } from '../club/AccountCard'
import { RsvpForm } from '../club/RsvpForm'
import { SignInForm } from '../club/SignInForm'
import { SuggestionForm } from '../club/SuggestionForm'
import { useScreenings } from '../club/screenings'
import { useClubSession } from '../club/session'
import { type Sheet as SheetKind, useScene } from '../shell/sceneState'
import { closeSheet, openSheet, Sheet, useSheetKeys } from './Sheet'

export const openAccount = () => openSheet('account')
export const openRsvp = () => openSheet('rsvp')
export const openSuggestions = () => openSheet('suggest')

function AccountView() {
  const signedIn = useClubSession((state) => state.session.name !== null)
  return (
    <Sheet title={signedIn ? 'Your account' : 'Sign in'}>
      {signedIn ? <AccountCard /> : <SignInForm autoFocus />}
    </Sheet>
  )
}

function RsvpView() {
  const next = useScreenings((state) => state.next)
  return (
    <Sheet title="RSVP line">
      {next === null ? (
        <p className="club-form__hint">
          Nothing is on the schedule yet, so there’s nothing to RSVP for.
        </p>
      ) : (
        <RsvpForm screening={next} onDone={closeSheet} />
      )}
    </Sheet>
  )
}

function SuggestView() {
  return (
    <Sheet title="Suggestion box">
      <SuggestionForm onDone={closeSheet} />
    </Sheet>
  )
}

const VIEWS: Record<SheetKind, ComponentType> = {
  account: AccountView,
  rsvp: RsvpView,
  suggest: SuggestView,
}

export function Sheets({ active }: { active: boolean }) {
  const sheet = useScene((state) => state.sheet)
  useSheetKeys(active)
  const View = active && sheet ? VIEWS[sheet] : null
  return View === null ? null : <View />
}
