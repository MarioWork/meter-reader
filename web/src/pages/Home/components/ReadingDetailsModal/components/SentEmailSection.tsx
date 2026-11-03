import { useId } from 'react';
import type { SentEmailApiModel } from '@app-types/models';
import type { DetailsPhoto } from '../readingDetailsUtils';
import SentEmail from './SentEmail';

type Props = {
  sentEmail: SentEmailApiModel | null;
  photo?: DetailsPhoto;
};

const TITLE = 'Email sent';
const NOT_KEPT_MESSAGE = 'This reading was sent before the app kept a copy of its email.';

// The email as it went out, the user's edits included, laid out like a message: who it went to, the subject, the
// body and whether the photo went with it. Readings sent before the API kept it say so instead.
function SentEmailSection({ sentEmail, photo }: Props) {
  const titleId = useId();

  return (
    <section aria-labelledby={titleId} className="flex flex-col gap-2">
      <h3 id={titleId} className="text-sm font-semibold">
        {TITLE}
      </h3>
      {sentEmail ? (
        <SentEmail sentEmail={sentEmail} photo={photo} />
      ) : (
        <p className="text-sm text-muted-foreground">{NOT_KEPT_MESSAGE}</p>
      )}
    </section>
  );
}

export default SentEmailSection;
