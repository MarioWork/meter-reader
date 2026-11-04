import { Card, CardContent } from '@components/ui/card';
import ReadingDigits from './ReadingDigits';
import PhoneSummaryHeader from './PhoneSummaryHeader';

// A phone's top of the page, as one card: the title row (the day, its status, Send and the "⋯" menu), then the digits
// and the water used.
function PhoneSummaryCard() {
  return (
    <Card>
      <CardContent className="flex flex-col gap-4">
        <PhoneSummaryHeader />
        <ReadingDigits />
      </CardContent>
    </Card>
  );
}

export default PhoneSummaryCard;
