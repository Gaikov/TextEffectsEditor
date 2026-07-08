import { makeAutoObservable } from 'mobx';
import { isValidFont } from '../fonts';

class FontStore {
  text = 'Hello World';
  fontFamily = 'Arial';
  fontSize = 72;
  fontColor = '#10161A';
  canvasWidth = 1200;
  canvasHeight = 800;
  boldWeight = 400;
  italic = false;

  constructor() {
    makeAutoObservable(this);
  }

  setText = (v: string) => {
    this.text = v;
  };

  setFontFamily = (v: string) => {
    this.fontFamily = v;
  };

  setFontSize = (v: number) => {
    this.fontSize = v;
  };

  setFontColor = (v: string) => {
    this.fontColor = v;
  };

  setCanvasWidth = (v: number) => {
    this.canvasWidth = Math.max(1, v);
  };

  setCanvasHeight = (v: number) => {
    this.canvasHeight = Math.max(1, v);
  };

  setBoldWeight = (v: number) => {
    this.boldWeight = v;
  };

  toggleItalic = () => {
    this.italic = !this.italic;
  };

  get fontValid(): boolean {
    return isValidFont(this.fontFamily);
  }
}

export const fontStore = new FontStore();
