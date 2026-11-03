import { ImageIcon } from 'lucide-react';
import { useLoaderData, useLocation, useNavigate } from 'react-router';
import { BASE_ROUTES_PATHS } from '@application/routes/routesUtils';
import { ReadingStatusUtil, type LoaderDataUtil } from '@app-types/utility';
import { formatIsoDate } from '@utils/dateUtils';
import { getPhotoUrl } from '@pages/Home/readingPhotoUtils';
import ResponsiveDialog from '@components/ResponsiveDialog';
import SendReadingLink from '../SendReadingLink';
import PhotoReveal from './components/PhotoReveal';
import ReadingDetailsList from './components/ReadingDetailsList';
import SentEmailSection from './components/SentEmailSection';
import type { loader } from './readingDetailsModalLoader';
import type { DetailsPhoto } from './readingDetailsUtils';

const TITLE_PREFIX = 'Reading of';
const DESCRIPTION = 'Everything saved about this reading.';
const PHOTO_DESCRIPTION = 'The meter showing';
const SHOW_PHOTO_LABEL = 'Show photo';

// One reading in full, over the history: every field the app keeps, and the email once it is sent. The photo shows
// only when asked for: from "Photo attached" in the email, or "Show photo" when no email shows it. Open for as long as
// its route is: Escape, a tap outside it or the × go back to the same page of the history.
function ReadingDetailsModal() {
  const { reading } = useLoaderData<LoaderDataUtil<typeof loader>>();
  const navigate = useNavigate();
  const { search } = useLocation();

  const readingDate = formatIsoDate(reading.date);
  const photo: DetailsPhoto | undefined =
    reading.photoId === null
      ? undefined
      : {
          url: getPhotoUrl(reading.photoId),
          description: `${PHOTO_DESCRIPTION} ${reading.digits} on ${readingDate}`,
        };
  const isSent = reading.status === ReadingStatusUtil.SENT;
  const isPhotoInEmail = isSent && reading.sentEmail?.hasPhoto === true;
  const closeDetails = () => void navigate({ pathname: BASE_ROUTES_PATHS.HOME, search });

  const handleOpenChange = (isOpening: boolean) => {
    if (isOpening) return;

    closeDetails();
  };

  const footer = <SendReadingLink reading={reading} isProminent hasText />;

  return (
    <ResponsiveDialog
      title={`${TITLE_PREFIX} ${readingDate}`}
      description={DESCRIPTION}
      isOpen
      onOpenChange={handleOpenChange}
      footer={footer}
    >
      <ReadingDetailsList reading={reading} />
      {photo && !isPhotoInEmail && (
        <PhotoReveal
          label={SHOW_PHOTO_LABEL}
          Icon={ImageIcon}
          photoUrl={photo.url}
          photoDescription={photo.description}
        />
      )}
      {isSent && <SentEmailSection sentEmail={reading.sentEmail} photo={photo} />}
    </ResponsiveDialog>
  );
}

export default ReadingDetailsModal;
