import CostAndBillCard from '../../CostAndBillCard';
import DetailsCard from '../../DetailsCard';
import EmailCard from '../../EmailCard';
import ReadingPhoto from '../../ReadingPhoto';
import ReadingDigits from './ReadingDigits';
import ReadingPageMenu from './ReadingPageMenu';
import ReadingSendAction from '../../ReadingSendAction';
import ReadingTitle from './ReadingTitle';
import { useReading } from '../../../hooks/useReading';

// The title with the send action and the "⋯" menu on its right; under it two columns from lg, the photo on the left
// and the digits, the cost & bill and the details on the right; the email across the whole width below. Narrower, the
// two columns stack in the same order.
function WideLayout() {
  const reading = useReading();
  return (
    <>
      <header className="flex flex-wrap items-start justify-between gap-4">
        <ReadingTitle isStatusBeside />
        <div className="flex items-center gap-2">
          <ReadingSendAction />
          <ReadingPageMenu />
        </div>
      </header>
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <ReadingPhoto />
        <div className="flex flex-col gap-6">
          <ReadingDigits digits={reading.digits} />
          <CostAndBillCard />
          <DetailsCard />
        </div>
      </div>
      <EmailCard />
    </>
  );
}

export default WideLayout;
