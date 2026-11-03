import type { ReadingApiModel } from '@app-types/models';
import { useIsWideScreen } from '@hooks/useIsWideScreen';
import LastReadingCard from '../LastReadingCard';
import ReadingTable from '../ReadingTable';
import ReadingCardList from './components/ReadingCardList';
import { useHistoryFocus } from './hooks/useHistoryFocus';

type Props = {
  readings: ReadingApiModel[];
  isFiltered: boolean;
};

const EARLIER_TITLE = 'Earlier readings';
const MATCHING_TITLE = 'Matching readings';
const TABLE_TITLE = 'Readings';

// The history, newest first, as the API ordered it. A wide screen has the room for one table, a row per reading. A
// phone gets the newest reading on its own card at the top, then every earlier one as a card of its own. While a
// filter is on, the newest match is not "the last reading", so every match is a card in one list.
function ReadingHistory({ readings, isFiltered }: Props) {
  const { lastReadingRef, readingListRef } = useHistoryFocus(readings);
  const isWideScreen = useIsWideScreen();
  const [lastReading, ...earlierReadings] = readings;
  const hasEarlierReadings = earlierReadings.length > 0;

  if (isWideScreen) {
    const tableTitle = isFiltered ? MATCHING_TITLE : TABLE_TITLE;

    return <ReadingTable ref={readingListRef} title={tableTitle} readings={readings} />;
  }

  if (isFiltered) return <ReadingCardList ref={readingListRef} title={MATCHING_TITLE} readings={readings} />;

  return (
    <>
      {/* Keyed by the reading: once the newest is deleted, the next one gets a fresh card, its dialogs closed. */}
      <LastReadingCard key={lastReading.id} ref={lastReadingRef} reading={lastReading} />
      {hasEarlierReadings && <ReadingCardList ref={readingListRef} title={EARLIER_TITLE} readings={earlierReadings} />}
    </>
  );
}

export default ReadingHistory;
