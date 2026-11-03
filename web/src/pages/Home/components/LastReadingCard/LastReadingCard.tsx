import { useId } from 'react';
import type { ReadingApiModel } from '@app-types/models';
import ReadingCard from '../ReadingCard';

type Props = {
  reading: ReadingApiModel;
  // Focused after a send or a delete here took focus away (useHistoryFocus).
  ref: React.Ref<HTMLElement>;
};

const TITLE = 'Last reading';

// The newest reading, under its own heading like the earlier ones: the same card, with bigger digits.
function LastReadingCard({ reading, ref }: Props) {
  const titleId = useId();

  return (
    <section
      ref={ref}
      tabIndex={-1}
      aria-labelledby={titleId}
      className="flex flex-col gap-3 rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
    >
      <h2 id={titleId} className="text-lg font-semibold">
        {TITLE}
      </h2>
      <ReadingCard reading={reading} isProminent />
    </section>
  );
}

export default LastReadingCard;
