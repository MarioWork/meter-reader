import { cn } from '@utils/classNameUtils';

type Props = React.ComponentProps<'div'>;

// A page tile: a bordered card on the page's background, the same radius and padding on every page.
function Tile({ className, ...props }: Props) {
  return <div className={cn('rounded-xl border bg-card p-4', className)} {...props} />;
}

export default Tile;
