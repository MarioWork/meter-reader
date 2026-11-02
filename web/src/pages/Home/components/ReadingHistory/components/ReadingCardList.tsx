import { useId } from 'react';
import type { ReadingApiModel } from '@app-types/models';
import ReadingHistoryCard from './ReadingHistoryCard';

type Props = {
  title: string;
  readings: ReadingApiModel[];
  // Focused after a send or a delete here took focus away (useHistoryFocus).
  ref: React.Ref<HTMLElement>;
};

// A titled list of readings, newest first, one card each: the earlier readings below the last one, or every reading
// the filters match.
function ReadingCardList({ title, readings, ref }: Props) {
  const titleId = useId();

  return (
    <section
      ref={ref}
      tabIndex={-1}
      aria-labelledby={titleId}
      className="flex flex-col gap-3 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
    >
      <h2 id={titleId} className="text-lg font-semibold">
        {title}
      </h2>
      <ul className="flex flex-col gap-3">
        {readings.map((reading) => (
          <li key={reading.id}>
            <ReadingHistoryCard reading={reading} />
          </li>
        ))}
      </ul>
    </section>
  );
}

export default ReadingCardList;
