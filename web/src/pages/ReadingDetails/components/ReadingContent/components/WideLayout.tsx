import CostAndBillCard from '../../CostAndBillCard';
import DetailsCard from '../../DetailsCard';
import EmailCard from '../../EmailCard';
import ReadingPhoto from '../../ReadingPhoto';
import ReadingDigits from './ReadingDigits';
import ReadingNeighbourLinks from './ReadingNeighbourLinks';
import ReadingTitle from './ReadingTitle';
import WideHeaderActions from './WideHeaderActions';

// Previous and Next above the title, which has the send action and the "⋯" menu on its right; under it two columns
// from lg, the photo on the left and the digits, the cost & bill and the details on the right; the email across the
// whole width below. Narrower, the two columns stack in the same order.
function WideLayout() {
  return (
    <>
      <header className="flex flex-col gap-3">
        <ReadingNeighbourLinks />
        <div className="flex flex-wrap items-start justify-between gap-4">
          <ReadingTitle isStatusBeside />
          <WideHeaderActions />
        </div>
      </header>
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <ReadingPhoto />
        <div className="flex flex-col gap-6">
          <ReadingDigits />
          <CostAndBillCard />
          <DetailsCard />
        </div>
      </div>
      <EmailCard />
    </>
  );
}

export default WideLayout;
