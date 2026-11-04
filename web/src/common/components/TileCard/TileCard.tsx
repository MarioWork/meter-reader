import { Card } from '@components/ui/card';
import { cn } from '@utils/classNameUtils';

type Props = React.ComponentProps<typeof Card>;

// shadcn's Card with the look of the pages' tiles (Tile): a border instead of the card's ring, so a page's titled
// cards and its tiles match.
function TileCard({ className, ...props }: Props) {
  return <Card className={cn('border ring-0', className)} {...props} />;
}

export default TileCard;
