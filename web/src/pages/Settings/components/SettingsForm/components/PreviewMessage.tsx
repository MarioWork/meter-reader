type Props = {
  subject: string;
  body: string;
};

const SUBJECT_LABEL = 'Subject';
const BODY_LABEL = 'Body';
const LABEL_CLASSES = 'text-muted-foreground';

// The previewed email's subject and body, under its addresses.
function PreviewMessage({ subject, body }: Props) {
  return (
    <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 border-t pt-3">
      <dt className={LABEL_CLASSES}>{SUBJECT_LABEL}</dt>
      <dd className="font-medium wrap-break-word">{subject}</dd>
      <dt className={LABEL_CLASSES}>{BODY_LABEL}</dt>
      <dd className="font-mono wrap-break-word whitespace-pre-wrap">{body}</dd>
    </dl>
  );
}

export default PreviewMessage;
