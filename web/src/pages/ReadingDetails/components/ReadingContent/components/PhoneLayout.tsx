import CostAndBillCard from '../../CostAndBillCard';
import DetailsCard from '../../DetailsCard';
import EmailCard from '../../EmailCard';
import ReadingPhoto from '../../ReadingPhoto';
import ReadingDigits from './ReadingDigits';
import ReadingNeighbourLinks from './ReadingNeighbourLinks';
import ReadingPageMenu from './ReadingPageMenu';
import ReadingSendAction from '../../ReadingSendAction';
import ReadingTitle from './ReadingTitle';

// One column: Previous and Next, the day and its status with the "⋯" menu beside them, the digits and the water used,
// the send action under them, then the photo, the cost & bill, the email and the details.
function PhoneLayout() {
  return (
    <>
      <header className="flex flex-col gap-3">
        <ReadingNeighbourLinks />
        <div className="flex items-start justify-between gap-3">
          <ReadingTitle />
          <ReadingPageMenu />
        </div>
      </header>
      <ReadingDigits />
      <ReadingSendAction className="w-full" />
      <ReadingPhoto />
      <CostAndBillCard />
      <EmailCard />
      <DetailsCard />
    </>
  );
}

export default PhoneLayout;
