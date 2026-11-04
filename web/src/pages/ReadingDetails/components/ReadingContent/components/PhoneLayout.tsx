import CostAndBillCard from '../../CostAndBillCard';
import DetailsCard from '../../DetailsCard';
import EmailCard from '../../EmailCard';
import ReadingPhoto from '../../ReadingPhoto';
import ReadingDigits from './ReadingDigits';
import ReadingPageMenu from './ReadingPageMenu';
import ReadingSendAction from '../../ReadingSendAction';
import ReadingTitle from './ReadingTitle';
import { useReading } from '../../../hooks/useReading';

// One column: the day and its status with the "⋯" menu beside them, the digits, the send action under them, then the
// photo, the cost & bill, the email and the details.
function PhoneLayout() {
  const reading = useReading();
  return (
    <>
      <header className="flex items-start justify-between gap-3">
        <ReadingTitle />
        <ReadingPageMenu />
      </header>
      <ReadingDigits digits={reading.digits} />
      <ReadingSendAction className="w-full" />
      <ReadingPhoto />
      <CostAndBillCard />
      <EmailCard />
      <DetailsCard />
    </>
  );
}

export default PhoneLayout;
