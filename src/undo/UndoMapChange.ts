import type { IUndoOperation } from './IUndoOperation';

export class UndoMapChange<K, V> implements IUndoOperation {
  constructor(
    private readonly target: Map<K, V>,
    private readonly previousValue: Map<K, V>,
    private readonly nextValue: Map<K, V>,
    public readonly label?: string,
    private readonly afterApply?: () => void,
  ) {}

  undo() {
    this.replaceWith(this.previousValue);
  }

  redo() {
    this.replaceWith(this.nextValue);
  }

  private replaceWith(value: Map<K, V>) {
    this.target.clear();
    value.forEach((item, key) => {
      this.target.set(key, item);
    });
    this.afterApply?.();
  }
}
