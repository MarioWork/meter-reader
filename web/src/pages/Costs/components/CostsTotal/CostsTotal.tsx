import { useId } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@components/ui/card';
import { formatCost } from '@utils/costUtils';

type Props = {
  totalCostCents: number;
  costCount: number;
  className?: string;
};

const TITLE = 'Total';
const DISPLAY_LOCALE = 'en-GB';
const READING_WORDS: Record<Intl.LDMLPluralRule, string> = {
  zero: 'readings',
  one: 'reading',
  two: 'readings',
  few: 'readings',
  many: 'readings',
  other: 'readings',
};
const PLURAL_RULES = new Intl.PluralRules(DISPLAY_LOCALE);

// "1 reading", "11 readings".
function costCountLabel(costCount: number): string {
  return `${costCount} ${READING_WORDS[PLURAL_RULES.select(costCount)]}`;
}

// The sum of the Costs shown, and how many readings it adds up: those with a Cost, not those with only a Bill. A
// region named by its heading, so it can be found.
function CostsTotal({ totalCostCents, costCount, className }: Props) {
  const titleId = useId();

  return (
    <Card role="region" aria-labelledby={titleId} className={className}>
      <CardHeader>
        <CardTitle>
          <h2 id={titleId}>{TITLE}</h2>
        </CardTitle>
        <CardDescription>{costCountLabel(costCount)}</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-bold tabular-nums">{formatCost(totalCostCents)}</p>
      </CardContent>
    </Card>
  );
}

export default CostsTotal;
