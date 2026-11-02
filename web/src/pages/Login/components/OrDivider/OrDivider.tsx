import { Separator } from '@components/ui/separator';

// "or" between the two ways to sign in, with a line on each side. Not shadcn's FieldSeparator: its label sits on
// bg-background, which shows as a patch inside the card.
function OrDivider() {
  return (
    <div className="flex items-center gap-3 text-sm text-muted-foreground">
      <Separator className="flex-1" />
      <span>or</span>
      <Separator className="flex-1" />
    </div>
  );
}

export default OrDivider;
