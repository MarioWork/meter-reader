import { useId } from 'react';
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@components/ui/card';
import CostAndBillList from './components/CostAndBillList';
import { hasCostOrBill } from '@utils/costAndBillUtils';
import CostAndBillLink from './components/CostAndBillLink';
import { useReading } from '../../hooks/useReading';

const TITLE = 'Cost & bill';

// What the reading cost and its bill, with Edit, which opens the cost & bill dialog over this page. With neither yet,
// one "Add cost & bill" stands in for two empty rows.
function CostAndBillCard() {
  const reading = useReading();
  const titleId = useId();
  const isEditing = hasCostOrBill(reading);

  return (
    <Card role="region" aria-labelledby={titleId}>
      <CardHeader>
        <CardTitle>
          <h2 id={titleId}>{TITLE}</h2>
        </CardTitle>
        {isEditing && (
          <CardAction>
            <CostAndBillLink readingId={reading.id} isEditing />
          </CardAction>
        )}
      </CardHeader>
      <CardContent>
        {isEditing ? (
          <CostAndBillList costCents={reading.costCents} bill={reading.bill} />
        ) : (
          <CostAndBillLink readingId={reading.id} isEditing={false} />
        )}
      </CardContent>
    </Card>
  );
}

export default CostAndBillCard;
