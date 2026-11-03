import { useId } from 'react';
import { useWatch, type Control } from 'react-hook-form';
import type { UpdateSettings } from '@services/settingsService/settingsService.type';
import EmailAddresses from '@components/EmailAddresses';
import EmailFrame from '@components/EmailFrame';
import { fillTodaysEmail } from '@utils/messageTemplateUtils';

type Props = {
  control: Control<UpdateSettings>;
  from: string | null;
};

const SAMPLE_READING = '00123';
const TITLE = 'Preview';
const HINT = `How the email reads, with ${SAMPLE_READING} as the reading and today as the date, in the date format chosen.`;
const SUBJECT_LABEL = 'Subject';
const BODY_LABEL = 'Body';
const LABEL_CLASSES = 'text-muted-foreground';
const WATCHED_FIELDS = ['to', 'subjectTemplate', 'bodyTemplate', 'dateFormat'] as const;

// The email as it will go out, from what is typed in the form right now, saved or not, trimmed as the save trims it.
// An unknown placeholder stays as typed: the error under its field is the signal.
function EmailPreview({ control, from }: Props) {
  const titleId = useId();
  const [to, subjectTemplate, bodyTemplate, dateFormat] = useWatch({ control, name: WATCHED_FIELDS });

  const messageSettings = { subjectTemplate: subjectTemplate.trim(), bodyTemplate: bodyTemplate.trim(), dateFormat };
  const { subject, body } = fillTodaysEmail(messageSettings, SAMPLE_READING);
  const providerEmail = to.trim() || null;

  return (
    <section aria-labelledby={titleId} className="flex flex-col gap-2">
      <h2 id={titleId} className="text-base font-medium">
        {TITLE}
      </h2>
      <p className="-mt-1 text-sm text-muted-foreground">{HINT}</p>
      <EmailFrame>
        <EmailAddresses from={from} to={providerEmail} />
        <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 border-t pt-3">
          <dt className={LABEL_CLASSES}>{SUBJECT_LABEL}</dt>
          <dd className="font-medium wrap-break-word">{subject}</dd>
          <dt className={LABEL_CLASSES}>{BODY_LABEL}</dt>
          <dd className="font-mono wrap-break-word whitespace-pre-wrap">{body}</dd>
        </dl>
      </EmailFrame>
    </section>
  );
}

export default EmailPreview;
