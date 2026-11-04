import { useState, type ChangeEvent } from 'react';

// What the user did with the Bill field: a new file picked (it replaces the saved bill) and whether the saved bill is
// to be removed. Nothing changes on the server until the dialog is saved.
export function useBillChoice() {
  const [billFile, setBillFile] = useState<File | undefined>(undefined);
  const [isBillRemoved, setIsBillRemoved] = useState(false);

  const chooseBillFile = (event: ChangeEvent<HTMLInputElement>) => {
    setBillFile(event.target.files?.[0]);
  };

  const toggleBillRemoved = () => {
    setIsBillRemoved((wasRemoved) => !wasRemoved);
  };

  return { billFile, isBillRemoved, chooseBillFile, toggleBillRemoved };
}
