import { useWatch, type Control } from 'react-hook-form';
import type { UpdateSettings } from '@services/settingsService/settingsService.type';
import EmailAddresses from '@components/EmailAddresses';
import EmailFrame from '@components/EmailFrame';
import { fillTodaysEmail } from '@utils/messageTemplateUtils';
import SettingsSection from '../../SettingsSection';
import PreviewMessage from './PreviewMessage';

type Props = {
  control: Control<UpdateSettings>;
  from: string | null;
  className?: string;
};

const SAMPLE_READING = '00123';
const TITLE = 'Preview';
const HINT = `How the email reads, with ${SAMPLE_READING} as the reading and today as the date, in the date format chosen.`;
const WATCHED_FIELDS = ['to', 'clientNumber', 'subjectTemplate', 'bodyTemplate', 'dateFormat', 'dateLanguage'] as const;

// The email as it will go out, from what is typed in the form right now, saved or not, trimmed as the save trims it.
// An unknown placeholder stays as typed: the error under its field is the signal.
function EmailPreview({ control, from, className }: Props) {
  const [to, clientNumber, subjectTemplate, bodyTemplate, dateFormat, dateLanguage] = useWatch({
    control,
    name: WATCHED_FIELDS,
  });

  const messageSettings = {
    subjectTemplate: subjectTemplate.trim(),
    bodyTemplate: bodyTemplate.trim(),
    dateFormat,
    dateLanguage,
    clientNumber: clientNumber.trim() || null,
  };
  const { subject, body } = fillTodaysEmail(messageSettings, SAMPLE_READING);
  const providerEmail = to.trim() || null;

  return (
    <SettingsSection title={TITLE} description={HINT} className={className}>
      <EmailFrame>
        <EmailAddresses from={from} to={providerEmail} />
        <PreviewMessage subject={subject} body={body} />
      </EmailFrame>
    </SettingsSection>
  );
}

export default EmailPreview;
