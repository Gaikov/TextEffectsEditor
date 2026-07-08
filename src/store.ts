import { makeAutoObservable } from 'mobx';

class AppStore {
  isOpen = false;

  constructor() {
    makeAutoObservable(this);
  }

  open = () => {
    this.isOpen = true;
  };

  close = () => {
    this.isOpen = false;
  };
}

export const appStore = new AppStore();
