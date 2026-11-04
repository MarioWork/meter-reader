import { useId } from 'react';
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@components/ui/card';
import CostAndBillList from './components/CostAndBillList';
import { hasCostOrBill } from '@utils/costAndBillUtils';
import CostAndBillLink from './components/CostAndBillLink';
import { useReading } from '../../hooks/useReading';

const TITLE = 'Cost & bill';

// What the reading cost and its bill, the same two rows whether they are filled in yet or not, and in the corner the
// way to the cost & bill dialog over this page: a pencil once there is either, a plus until then.
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
        <CardAction>
          <CostAndBillLink readingId={reading.id} isEditing={isEditing} />
        </CardAction>
      </CardHeader>
      <CardContent>
        <CostAndBillList costCents={reading.costCents} bill={reading.bill} />
      </CardContent>
    </Card>
  );
}

export default CostAndBillCard;
