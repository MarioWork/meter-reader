import type { ReadingApiModel } from '@app-types/models';
import { useIsWideScreen } from '@hooks/useIsWideScreen';
import { ReadingContext } from '../../hooks/useReading';
import PhoneLayout from './components/PhoneLayout';
import WideLayout from './components/WideLayout';

type Props = {
  reading: ReadingApiModel;
};

// The same sections in two arrangements, each in the order it is read in, so focus and screen readers follow what is
// on screen: one column on a phone, the photo beside the digits and the cost on a wider screen. Every section reads
// the reading from here (useReading).
function ReadingContent({ reading }: Props) {
  const isWideScreen = useIsWideScreen();

  return <ReadingContext value={reading}>{isWideScreen ? <WideLayout /> : <PhoneLayout />}</ReadingContext>;
}

export default ReadingContent;
