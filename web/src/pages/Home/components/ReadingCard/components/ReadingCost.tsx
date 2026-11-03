import { formatCost } from '@utils/costUtils';

type Props = {
  costCents: number;
};

const COST_LABEL = 'Cost';

// What the reading cost, under its digits on the card: "Cost €42.10".
function ReadingCost({ costCents }: Props) {
  return (
    <p className="text-sm text-muted-foreground">
      {COST_LABEL} <span className="tabular-nums">{formatCost(costCents)}</span>
    </p>
  );
}

export default ReadingCost;
