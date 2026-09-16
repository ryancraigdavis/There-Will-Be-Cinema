import { AccountCard } from '../club/AccountCard'
import { SignInForm } from '../club/SignInForm'
import { useClubSession } from '../club/session'
import { useScene } from '../shell/sceneState'
import { openSheet, Sheet, useSheetKeys } from './Sheet'

export function openAccount() {
  openSheet('account')
}

export function AccountSheet({ active }: { active: boolean }) {
  const open = useScene((state) => state.sheet === 'account') && active
  const signedIn = useClubSession((state) => state.session.name !== null)
  useSheetKeys(active)
  return !open ? null : (
    <Sheet title={signedIn ? 'Your account' : 'Sign in'}>
      {signedIn ? <AccountCard /> : <SignInForm autoFocus />}
    </Sheet>
  )
}
