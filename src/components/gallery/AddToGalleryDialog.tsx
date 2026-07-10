import { useEffect, useRef, useState } from 'react';
import {
  Button,
  Dialog,
  DialogBody,
  DialogFooter,
  InputGroup,
} from '@blueprintjs/core';

const FIELD_STYLE: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
};

interface AddToGalleryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string) => void;
}

export default function AddToGalleryDialog({
  isOpen,
  onClose,
  onSave,
}: AddToGalleryDialogProps) {
  const [name, setName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    setName('');
    window.setTimeout(() => inputRef.current?.focus(), 0);
  }, [isOpen]);

  const save = () => {
    onSave(name);
    onClose();
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Add To Gallery"
      style={{ width: 420 }}
    >
      <DialogBody>
        <label style={FIELD_STYLE}>
          <span>Name</span>
          <InputGroup
            inputRef={inputRef}
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                save();
              }
            }}
            placeholder="Optional"
          />
        </label>
      </DialogBody>
      <DialogFooter
        actions={
          <>
            <Button text="Cancel" onClick={onClose} />
            <Button intent="primary" text="Save" onClick={save} />
          </>
        }
      />
    </Dialog>
  );
}
