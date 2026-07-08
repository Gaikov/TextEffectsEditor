import { observer } from 'mobx-react-lite';
import { Button, Dialog, DialogBody, DialogFooter } from '@blueprintjs/core';
import { appStore } from './store';
import styles from './App.module.css';

export default observer(function App() {
  return (
    <div className={styles.container}>
      <Button intent="primary" large onClick={appStore.open}>
        Открыть
      </Button>
      <Dialog
        isOpen={appStore.isOpen}
        onClose={appStore.close}
        title="Привет&thinsp;!"
        icon="info-sign"
      >
        <DialogBody>
          <p>Это всплывающее окно Blueprint Dialog.</p>
        </DialogBody>
        <DialogFooter
          actions={
            <Button intent="primary" onClick={appStore.close}>
              Закрыть
            </Button>
          }
        />
      </Dialog>
    </div>
  );
});
