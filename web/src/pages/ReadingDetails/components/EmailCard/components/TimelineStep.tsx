import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@utils/classNameUtils';
import { formatTimestamp } from '@utils/dateUtils';

type StepTone = 'muted' | 'success' | 'error';

type Props = {
  Icon: LucideIcon;
  // The icon's colour; the label always says the same in words.
  tone: StepTone;
  label: string;
  // When it happened, an ISO timestamp; null when the app does not know.
  timestamp: string | null;
  children?: ReactNode;
};

const TONE_CLASSES: Record<StepTone, string> = {
  muted: 'text-muted-foreground',
  success: 'text-success',
  error: 'text-destructive',
};

// One step of the email's timeline: an icon, what happened, when, and anything more to say about it.
function TimelineStep({ Icon, tone, label, timestamp, children }: Props) {
  return (
    <li className="flex gap-3">
      <Icon aria-hidden="true" className={cn('mt-0.5 size-4 shrink-0', TONE_CLASSES[tone])} />
      <div className="flex flex-col gap-1">
        <p>
          <span className="font-medium">{label}</span>
          {timestamp && (
            <>
              {' '}
              <time dateTime={timestamp} className="text-muted-foreground">
                {formatTimestamp(timestamp)}
              </time>
            </>
          )}
        </p>
        {children}
      </div>
    </li>
  );
}

export default TimelineStep;
