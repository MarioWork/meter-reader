import { EllipsisIcon } from 'lucide-react';
import { useLocation } from 'react-router';
import { ReadingStatusUtil } from '@app-types/utility';
import { READING_ROUTES_PATHS } from '@application/routes/routesUtils';
import DeleteReadingDialog from '@components/DeleteReadingDialog';
import { Button } from '@components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@components/ui/dropdown-menu';
import { useDeleteReading } from '@hooks/useDeleteReading';
import { useToWithSearch } from '@hooks/useToWithSearch';
import { getCostAndBillLabel } from '@utils/costAndBillUtils';
import ReadingPageMenuItems from './ReadingPageMenuItems';
import { useReading } from '../../../hooks/useReading';

const MENU_LABEL = 'More actions';
// The menu item's text, and the dialog's confirm button.
const DELETE_LABEL = 'Delete';

// The page's "⋯" menu: Resend once the reading is sent (the send preview, a routed modal over this page), the cost &
// bill dialog (a routed modal over this page) and Delete, which asks first and then
// goes back to Home through the page's own action.
function ReadingPageMenu() {
  const reading = useReading();
  const { search } = useLocation();
  const readingId = String(reading.id);
  const costAndBillDialog = useToWithSearch(READING_ROUTES_PATHS.detailsCostAndBill(readingId));
  const sendPreview = useToWithSearch(READING_ROUTES_PATHS.detailsSend(readingId));
  const isSent = reading.status === ReadingStatusUtil.SENT;
  // The page's own action, with Home's search, which it goes back to once the reading is gone.
  const { isOpen, isDeleting, failureMessage, openDialog, handleOpenChange, deleteReading } = useDeleteReading(
    `${READING_ROUTES_PATHS.details(readingId)}${search}`,
  );

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="ghost" size="icon-lg" aria-label={MENU_LABEL} />}>
          <EllipsisIcon />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-auto">
          <ReadingPageMenuItems
            resendTo={isSent ? sendPreview : undefined}
            costAndBillLabel={getCostAndBillLabel(reading)}
            costAndBillTo={costAndBillDialog}
            deleteLabel={DELETE_LABEL}
            onDelete={openDialog}
          />
        </DropdownMenuContent>
      </DropdownMenu>
      <DeleteReadingDialog
        reading={reading}
        isOpen={isOpen}
        isDeleting={isDeleting}
        failureMessage={failureMessage}
        deleteLabel={DELETE_LABEL}
        onOpenChange={handleOpenChange}
        onDelete={deleteReading}
      />
    </>
  );
}

export default ReadingPageMenu;
