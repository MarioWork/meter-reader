import { Trash2Icon, Undo2Icon } from 'lucide-react';
import type { ReadingBillApiModel } from '@app-types/models';
import { Button } from '@components/ui/button';
import { describeBill } from '@utils/billUtils';

type Props = {
  bill: ReadingBillApiModel;
  isRemoved: boolean;
  isDisabled: boolean;
  onToggleRemoved: () => void;
};

const SAVED_PREFIX = 'Saved bill:';
const REMOVED_TEXT = 'The saved bill is removed when you save.';
const REMOVE_LABEL = 'Remove bill';
const KEEP_LABEL = 'Keep bill';

// The bill the reading has now, and one button that marks it for removal or keeps it after all. The same button
// either way, so focus stays on it; the line beside it says what saving will do, and is read out when it changes.
function SavedBill({ bill, isRemoved, isDisabled, onToggleRemoved }: Props) {
  const Icon = isRemoved ? Undo2Icon : Trash2Icon;

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-muted/40 px-3 py-2">
      <p className="text-sm" aria-live="polite">
        {isRemoved ? REMOVED_TEXT : `${SAVED_PREFIX} ${describeBill(bill)}`}
      </p>
      <Button type="button" variant="outline" size="default" disabled={isDisabled} onClick={onToggleRemoved}>
        <Icon aria-hidden="true" />
        {isRemoved ? KEEP_LABEL : REMOVE_LABEL}
      </Button>
    </div>
  );
}

export default SavedBill;
