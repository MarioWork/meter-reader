import { PencilIcon, PlusIcon, type LucideIcon } from 'lucide-react';
import { Link } from 'react-router';
import { READING_ROUTES_PATHS } from '@application/routes/routesUtils';
import type { ReadingId } from '@app-types/models';
import { buttonVariants } from '@components/ui/button';
import { useToWithSearch } from '@hooks/useToWithSearch';

type Props = {
  readingId: ReadingId;
  // Edit once the reading has a cost or a bill; Add until then.
  isEditing: boolean;
};

type LinkText = {
  // The word it shows.
  text: string;
  // Its name, which starts with that word (WCAG 2.5.3) and says what it is for.
  label: string;
  Icon: LucideIcon;
};

const ADD_TEXT: LinkText = { text: 'Add cost & bill', label: 'Add cost & bill', Icon: PlusIcon };
const EDIT_TEXT: LinkText = { text: 'Edit', label: 'Edit cost & bill', Icon: PencilIcon };

// Opens the cost & bill dialog over this page. A link, as the dialog has its own url.
function CostAndBillLink({ readingId, isEditing }: Props) {
  const costAndBillDialog = useToWithSearch(READING_ROUTES_PATHS.detailsCostAndBill(String(readingId)));
  const { text, label, Icon } = isEditing ? EDIT_TEXT : ADD_TEXT;

  return (
    <Link to={costAndBillDialog} aria-label={label} className={buttonVariants({ variant: 'outline' })}>
      <Icon aria-hidden="true" />
      {text}
    </Link>
  );
}

export default CostAndBillLink;
