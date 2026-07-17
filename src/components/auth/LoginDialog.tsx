import {
  Button,
  Dialog,
  DialogBody,
  DialogFooter,
  NonIdealState,
} from '@blueprintjs/core';
import type { AuthProvider } from '../../auth/authClient';

interface LoginDialogProps {
  authInProgress: boolean;
  isOpen: boolean;
  onLogin: (provider: AuthProvider) => void;
  onClose: () => void;
}

export default function LoginDialog({
  authInProgress,
  isOpen,
  onClose,
  onLogin,
}: LoginDialogProps) {
  return (
    <Dialog isOpen={isOpen} onClose={onClose} title="Sign in required">
      <DialogBody>
        <NonIdealState
          icon="log-in"
          title="Sign in to use global effects"
          description="Global gallery effects are visible to everyone, but publishing and applying them requires a registered account."
        />
        {authInProgress ? (
          <p>
            Complete sign-in in the opened tab, then return here.
          </p>
        ) : null}
      </DialogBody>
      <DialogFooter
        actions={
          <>
            <Button text="Cancel" onClick={onClose} />
            <Button
              icon="endorsed"
              text="Continue with Google"
              onClick={() => onLogin('google')}
            />
            <Button
              icon="endorsed"
              text="Continue with Yandex"
              onClick={() => onLogin('yandex')}
            />
          </>
        }
      />
    </Dialog>
  );
}
