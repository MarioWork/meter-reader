import { Card, CardContent } from '@components/ui/card';
import ReadingTitle from './ReadingTitle';
import WideHeaderActions from './WideHeaderActions';

// A wide screen's top of the page, as a tile like the cards under it: the title, with its status beside it and the
// way back on its left, and the send action and the "⋯" menu on its right.
function WideHeaderCard() {
  return (
    <Card>
      <CardContent>
        <header className="flex flex-wrap items-center justify-between gap-4">
          <ReadingTitle isStatusBeside />
          <WideHeaderActions />
        </header>
      </CardContent>
    </Card>
  );
}

export default WideHeaderCard;
