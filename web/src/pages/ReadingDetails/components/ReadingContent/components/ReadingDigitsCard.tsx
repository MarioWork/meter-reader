import { Card, CardContent } from '@components/ui/card';
import ReadingDigits from './ReadingDigits';

// A wide screen's digits and the water used, as a card like the details and the cost & bill under it.
function ReadingDigitsCard() {
  return (
    <Card>
      <CardContent>
        <ReadingDigits />
      </CardContent>
    </Card>
  );
}

export default ReadingDigitsCard;
