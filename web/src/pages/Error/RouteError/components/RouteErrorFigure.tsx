import { Badge } from '@components/ui/badge';
import type { RouteErrorKind } from '../routeErrorUtils';
import MeterMascot from './MeterMascot';

type Props = {
  kind: RouteErrorKind;
  label: string;
};

// The mascot with its tag hanging off at a tilt.
function RouteErrorFigure({ kind, label }: Props) {
  return (
    <div className="relative">
      <MeterMascot pose={kind} className="w-36 text-muted-foreground" />
      <Badge variant="outline" className="absolute -bottom-1 -left-3 -rotate-6 bg-card shadow-sm">
        {label}
      </Badge>
    </div>
  );
}

export default RouteErrorFigure;
