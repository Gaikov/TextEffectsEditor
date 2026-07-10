import type { IUndoOperation } from './IUndoOperation';

export class UndoPropertyChange<
  T extends object,
  K extends keyof T,
> implements IUndoOperation {
  constructor(
    private readonly target: T,
    private readonly key: K,
    private readonly previousValue: T[K],
    private readonly nextValue: T[K],
    public readonly label?: string,
    private readonly afterApply?: () => void,
  ) {}

  undo() {
    this.target[this.key] = this.previousValue;
    this.afterApply?.();
  }

  redo() {
    this.target[this.key] = this.nextValue;
    this.afterApply?.();
  }
}
