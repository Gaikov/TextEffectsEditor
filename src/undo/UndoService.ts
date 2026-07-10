import { makeAutoObservable } from 'mobx';
import type { IUndoOperation } from './IUndoOperation';

export class UndoService {
  undoStack: IUndoOperation[] = [];
  redoStack: IUndoOperation[] = [];

  constructor() {
    makeAutoObservable(this);
  }

  get canUndo() {
    return this.undoStack.length > 0;
  }

  get canRedo() {
    return this.redoStack.length > 0;
  }

  execute(operation: IUndoOperation) {
    operation.redo();
    this.record(operation);
  }

  record(operation: IUndoOperation) {
    this.undoStack.push(operation);
    this.redoStack = [];
  }

  undo() {
    const operation = this.undoStack.pop();
    if (!operation) return;

    operation.undo();
    this.redoStack.push(operation);
  }

  redo() {
    const operation = this.redoStack.pop();
    if (!operation) return;

    operation.redo();
    this.undoStack.push(operation);
  }

  clear() {
    this.undoStack = [];
    this.redoStack = [];
  }
}

export const undoService = new UndoService();
