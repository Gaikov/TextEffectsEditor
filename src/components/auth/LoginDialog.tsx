import {
  Button,
  Dialog,
  DialogBody,
  DialogFooter,
  NonIdealState,
} from '@blueprintjs/core';
import { loginWithProvider } from '../../auth/authClient';

interface LoginDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LoginDialog({ isOpen, onClose }: LoginDialogProps) {
  return (
    <Dialog isOpen={isOpen} onClose={onClose} title="Sign in required">
      <DialogBody>
        <NonIdealState
          icon="log-in"
          title="Sign in to use global effects"
          description="Global gallery effects are visible to everyone, but publishing and applying them requires a registered account."
        />
      </DialogBody>
      <DialogFooter
        actions={
          <>
            <Button text="Cancel" onClick={onClose} />
            <Button
              icon="endorsed"
              text="Continue with Google"
              onClick={() => loginWithProvider('google')}
            />
            <Button
              icon="endorsed"
              text="Continue with Yandex"
              onClick={() => loginWithProvider('yandex')}
            />
          </>
        }
      />
    </Dialog>
  );
}
