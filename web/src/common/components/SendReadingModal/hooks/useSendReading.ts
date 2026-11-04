import { yupResolver } from '@hookform/resolvers/yup';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useFetcher, useLoaderData, useNavigate, useRouteLoaderData } from 'react-router';
import { EmailTextSchema, type EmailText } from '@services/readingService/readingService.type';
import { ROUTE_IDS } from '@application/routes/routesUtils';
import type { loader as signedInLayoutLoader } from '@application/layout/SignedInLayout/signedInLayoutLoader';
import { HttpVerbsUtil, MailStateUtil, type JSONResponseUtil, type LoaderDataUtil } from '@app-types/utility';
import { useFetcherFailure } from '@hooks/useFetcherFailure';
import { usePageBehindReadingModal } from '@hooks/usePageBehindReadingModal';
import { createFormData } from '@utils/formDataUtils';
import type { loader } from '../sendReadingModalLoader';

const FAILURE_MESSAGE = 'The reading could not be sent. Please try again.';

// The preview's state and the send's submit. The subject and body start as the server wrote them and the user can
// edit both; the photo goes with the email unless the user switches it off.
export function useSendReading() {
  // react-hook-form drives uncontrolled inputs through the `ref` callback `register()` returns on every render.
  'use no memo';

  const { readingEmail } = useLoaderData<LoaderDataUtil<typeof loader>>();
  const layoutData = useRouteLoaderData<LoaderDataUtil<typeof signedInLayoutLoader>>(ROUTE_IDS.SIGNED_IN_LAYOUT);
  // Null until the user flips the switch: the photo goes with the email by default, also one added in the preview.
  const [attachingChoice, setIsAttachingPhoto] = useState<boolean | null>(null);
  const isAttachingPhoto = readingEmail.attachment !== null && (attachingChoice ?? true);
  const { register, handleSubmit, formState } = useForm<EmailText>({
    defaultValues: { subject: readingEmail.subject, body: readingEmail.body },
    resolver: yupResolver(EmailTextSchema),
  });
  const fetcher = useFetcher<JSONResponseUtil>();
  const failureMessage = useFetcherFailure(fetcher, FAILURE_MESSAGE);
  const navigate = useNavigate();
  const pageBehind = usePageBehindReadingModal();

  const isMailConnected = layoutData?.mailStatus.state === MailStateUtil.CONNECTED;
  const hasProviderEmail = readingEmail.to !== null;
  const isSending = fetcher.state !== 'idle';

  // Back to the page it opened over.
  const closePreview = () => void navigate(pageBehind);

  // The preview asks to close on Escape, a tap outside it or a swipe down. Once the email is on its way it cannot be
  // called back, so the preview stays open until it is done.
  const handleOpenChange = (isOpening: boolean) => {
    if (isOpening || isSending) return;

    closePreview();
  };

  const sendReading = handleSubmit((emailText) =>
    fetcher.submit(createFormData({ attachPhoto: isAttachingPhoto, ...emailText }), { method: HttpVerbsUtil.POST }),
  );

  return {
    readingEmail,
    register,
    errors: formState.errors,
    isAttachingPhoto,
    setIsAttachingPhoto,
    isMailConnected,
    hasProviderEmail,
    isSending,
    failureMessage,
    handleOpenChange,
    sendReading,
  };
}
