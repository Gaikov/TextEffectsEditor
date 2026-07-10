import type { IUndoOperation } from './IUndoOperation';

export class UndoBatch implements IUndoOperation {
  constructor(
    private readonly operations: IUndoOperation[],
    public readonly label?: string,
  ) {}

  undo() {
    for (let i = this.operations.length - 1; i >= 0; i -= 1) {
      this.operations[i].undo();
    }
  }

  redo() {
    for (const operation of this.operations) {
      operation.redo();
    }
  }
}
