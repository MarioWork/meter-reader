import { Trash2Icon, Undo2Icon } from 'lucide-react';
import type { ReadingBillApiModel } from '@app-types/models';
import { Button } from '@components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@components/ui/tooltip';
import SavedBillSummary from './SavedBillSummary';

type Props = {
  bill: ReadingBillApiModel;
  isRemoved: boolean;
  isDisabled: boolean;
  onToggleRemoved: () => void;
};

const REMOVED_TEXT = 'The saved bill is removed when you save.';
const REMOVE_LABEL = 'Remove bill';
const KEEP_LABEL = 'Keep bill';

// The bill the reading has now, by its file name (which opens it in the app's viewer), and at the end of the row one
// icon button that marks it for removal or keeps it after all: a trash can, then an undo arrow. The same button either
// way, so focus stays on it; its label is its name and its tooltip. The line beside it says what saving will do, and
// is read out when it changes. 32 px square, over the 24 px minimum target.
function SavedBill({ bill, isRemoved, isDisabled, onToggleRemoved }: Props) {
  const Icon = isRemoved ? Undo2Icon : Trash2Icon;
  const label = isRemoved ? KEEP_LABEL : REMOVE_LABEL;

  return (
    <div className="flex items-center justify-between gap-2 rounded-lg border bg-muted/40 py-2 pr-2 pl-3">
      <div className="min-w-0 text-sm" aria-live="polite">
        {isRemoved ? <p>{REMOVED_TEXT}</p> : <SavedBillSummary bill={bill} />}
      </div>
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={label}
              disabled={isDisabled}
              onClick={onToggleRemoved}
              className="shrink-0"
            />
          }
        >
          <Icon aria-hidden="true" />
        </TooltipTrigger>
        <TooltipContent>{label}</TooltipContent>
      </Tooltip>
    </div>
  );
}

export default SavedBill;
