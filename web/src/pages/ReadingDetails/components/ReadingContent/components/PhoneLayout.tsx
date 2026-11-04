import CostAndBillCard from '../../CostAndBillCard';
import DetailsCard from '../../DetailsCard';
import EmailCard from '../../EmailCard';
import ReadingPhoto from '../../ReadingPhoto';
import PhoneSummaryCard from './PhoneSummaryCard';
import ReadingNeighbourLinks from './ReadingNeighbourLinks';

// One column: the summary card (the day, its status, Send, the digits), then the photo, the details, the cost & bill
// and the email, and Previous and Next at the very end, where the reading has been read through.
function PhoneLayout() {
  return (
    <>
      <PhoneSummaryCard />
      <ReadingPhoto />
      <DetailsCard />
      <CostAndBillCard />
      <EmailCard />
      <ReadingNeighbourLinks />
    </>
  );
}

export default PhoneLayout;
