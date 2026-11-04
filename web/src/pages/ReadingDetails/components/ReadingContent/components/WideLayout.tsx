import CostAndBillCard from '../../CostAndBillCard';
import DetailsCard from '../../DetailsCard';
import EmailCard from '../../EmailCard';
import ReadingPhoto from '../../ReadingPhoto';
import ReadingDigitsCard from './ReadingDigitsCard';
import ReadingNeighbourLinks from './ReadingNeighbourLinks';
import WideHeaderCard from './WideHeaderCard';

// A tile with the title, the way back as a chevron on its left, and the send action and the "⋯" menu on its right;
// under it two columns from lg, the photo on the left, as tall as the whole right column, and the digits, the details
// and the cost & bill on the right, each a card; the email across the whole width below, then Previous and Next at
// the very end, as on a phone. Narrower, the two columns stack in the same order.
function WideLayout() {
  return (
    <>
      <WideHeaderCard />
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:items-stretch">
        <ReadingPhoto isStretched />
        <div className="flex flex-col gap-6">
          <ReadingDigitsCard />
          <DetailsCard />
          <CostAndBillCard />
        </div>
      </div>
      <EmailCard />
      <ReadingNeighbourLinks />
    </>
  );
}

export default WideLayout;
