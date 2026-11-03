import { useLoaderData, useLocation, useNavigate } from 'react-router';
import { BASE_ROUTES_PATHS } from '@application/routes/routesUtils';
import type { LoaderDataUtil } from '@app-types/utility';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@components/ui/dialog';
import NewReadingForm from '@pages/NewReading/components/NewReadingForm';
import type { loader } from '@pages/NewReading/newReadingLoader';

const DIALOG_TITLE = 'New reading';

// New reading on a screen wider than a phone, over the history. Open for as long as its route is: Escape, a click
// outside or the close button go back to the same page of the history; a save redirects Home, which closes it too.
function NewReadingModal() {
  const { lastReading, emailDefaults } = useLoaderData<LoaderDataUtil<typeof loader>>();
  const navigate = useNavigate();
  const { search } = useLocation();

  const handleOpenChange = (isOpening: boolean) => {
    if (isOpening) return;

    void navigate({ pathname: BASE_ROUTES_PATHS.HOME, search });
  };

  return (
    <Dialog open onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{DIALOG_TITLE}</DialogTitle>
        </DialogHeader>
        <NewReadingForm lastReading={lastReading} emailDefaults={emailDefaults} />
      </DialogContent>
    </Dialog>
  );
}

export default NewReadingModal;
