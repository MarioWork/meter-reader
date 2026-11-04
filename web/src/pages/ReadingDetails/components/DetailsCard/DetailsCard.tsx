import { useId } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@components/ui/card';
import DetailsList from './components/DetailsList';
import { useReading } from '../../hooks/useReading';

const TITLE = 'Details';

// The day the meter was read, and when the reading was saved in the app.
function DetailsCard() {
  const reading = useReading();
  const titleId = useId();

  return (
    <Card role="region" aria-labelledby={titleId}>
      <CardHeader>
        <CardTitle>
          <h2 id={titleId}>{TITLE}</h2>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <DetailsList date={reading.date} createdAt={reading.createdAt} />
      </CardContent>
    </Card>
  );
}

export default DetailsCard;
