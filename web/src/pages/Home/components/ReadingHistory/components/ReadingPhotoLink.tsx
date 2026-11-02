import type { ReadingApiModel } from '@app-types/models';
import { formatIsoDate } from '@utils/dateUtils';
import { getPhotoUrl } from './readingPhotoUtils';

type Props = {
  reading: ReadingApiModel;
};

const PREVIEW_SIZE_PX = 48;

// A small preview; tapping it opens the full photo in a new tab. A link, because it goes somewhere.
function ReadingPhotoLink({ reading }: Props) {
  if (reading.photoId === null) return <span className="text-gray-600">No photo</span>;

  const photoUrl = getPhotoUrl(reading.photoId);
  const description = `Meter showing ${reading.digits} on ${formatIsoDate(reading.date)} (opens in a new tab)`;

  return (
    <a
      href={photoUrl}
      target="_blank"
      rel="noreferrer"
      className="inline-block rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
    >
      <img
        src={photoUrl}
        alt={description}
        width={PREVIEW_SIZE_PX}
        height={PREVIEW_SIZE_PX}
        loading="lazy"
        className="size-12 rounded-sm border border-gray-300 object-cover"
      />
    </a>
  );
}

export default ReadingPhotoLink;
