import type { IUndoOperation } from './IUndoOperation';

export class UndoArrayChange<T> implements IUndoOperation {
  constructor(
    private readonly target: T[],
    private readonly previousValue: T[],
    private readonly nextValue: T[],
    public readonly label?: string,
    private readonly afterApply?: () => void,
  ) {}

  undo() {
    this.target.splice(0, this.target.length, ...this.previousValue);
    this.afterApply?.();
  }

  redo() {
    this.target.splice(0, this.target.length, ...this.nextValue);
    this.afterApply?.();
  }
}
