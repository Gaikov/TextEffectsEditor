import { Intent, OverlayToaster, Position, type Toaster } from '@blueprintjs/core';

let toasterPromise: Promise<Toaster> | undefined;

function getToaster() {
  toasterPromise ??= OverlayToaster.create({
    maxToasts: 3,
    position: Position.BOTTOM_LEFT,
  });
  return toasterPromise;
}

function showToast(message: string, intent: Intent, timeout: number) {
  void getToaster().then((toaster) => {
    toaster.show({
      icon: intent === Intent.SUCCESS ? 'tick-circle' : 'error',
      intent,
      message,
      timeout,
    });
  });
}

export function showSuccessToast(message: string) {
  showToast(message, Intent.SUCCESS, 2500);
}

export function showFailureToast(message: string) {
  showToast(message, Intent.DANGER, 4000);
}
