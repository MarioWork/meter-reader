import type { ReadingApiModel } from '@app-types/models';
import LastReadingCard from '../LastReadingCard';
import EarlierReadings from './components/EarlierReadings';
import { useHistoryFocus } from './hooks/useHistoryFocus';

type Props = {
  lastReading: ReadingApiModel;
  earlierReadings: ReadingApiModel[];
};

// The history, newest first, as the API ordered it: the newest reading on its own card at the top, then every
// earlier one as a card of its own.
function ReadingHistory({ lastReading, earlierReadings }: Props) {
  const { lastReadingRef, earlierReadingsRef } = useHistoryFocus([lastReading, ...earlierReadings]);
  const hasEarlierReadings = earlierReadings.length > 0;

  return (
    <>
      {/* Keyed by the reading: once the newest is deleted, the next one gets a fresh card, its dialogs closed. */}
      <LastReadingCard key={lastReading.id} ref={lastReadingRef} reading={lastReading} />
      {hasEarlierReadings && <EarlierReadings ref={earlierReadingsRef} readings={earlierReadings} />}
    </>
  );
}

export default ReadingHistory;
