export interface IUndoOperation {
  readonly label?: string;
  undo: () => void;
  redo: () => void;
}
