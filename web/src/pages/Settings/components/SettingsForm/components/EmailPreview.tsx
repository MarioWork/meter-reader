import { useWatch, type Control } from 'react-hook-form';
import type { UpdateSettings } from '@services/settingsService/settingsService.type';
import EmailAddresses from '@components/EmailAddresses';
import EmailFrame from '@components/EmailFrame';
import { fillTodaysEmail } from '@utils/messageTemplateUtils';
import SettingsCard from '../../SettingsCard';
import PreviewMessage from './PreviewMessage';

type Props = {
  control: Control<UpdateSettings>;
  from: string | null;
};

const SAMPLE_READING = '00123';
const TITLE = 'Preview';
const HINT = `How the email reads, with ${SAMPLE_READING} as the reading and today as the date, in the date format chosen.`;
const WATCHED_FIELDS = ['to', 'subjectTemplate', 'bodyTemplate', 'dateFormat'] as const;

// The email as it will go out, from what is typed in the form right now, saved or not, trimmed as the save trims it.
// An unknown placeholder stays as typed: the error under its field is the signal.
function EmailPreview({ control, from }: Props) {
  const [to, subjectTemplate, bodyTemplate, dateFormat] = useWatch({ control, name: WATCHED_FIELDS });

  const messageSettings = { subjectTemplate: subjectTemplate.trim(), bodyTemplate: bodyTemplate.trim(), dateFormat };
  const { subject, body } = fillTodaysEmail(messageSettings, SAMPLE_READING);
  const providerEmail = to.trim() || null;

  return (
    <SettingsCard title={TITLE} description={HINT}>
      <EmailFrame>
        <EmailAddresses from={from} to={providerEmail} />
        <PreviewMessage subject={subject} body={body} />
      </EmailFrame>
    </SettingsCard>
  );
}

export default EmailPreview;
