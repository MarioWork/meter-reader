import { yupResolver } from '@hookform/resolvers/yup';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useFetcher, useLoaderData, useLocation, useNavigate, useRouteLoaderData } from 'react-router';
import { EmailTextSchema, type EmailText } from '@services/readingService/readingService.type';
import { BASE_ROUTES_PATHS, ROUTE_IDS } from '@application/routes/routesUtils';
import type { loader as signedInLayoutLoader } from '@application/layout/SignedInLayout/signedInLayoutLoader';
import { HttpVerbsUtil, MailStateUtil, type JSONResponseUtil, type LoaderDataUtil } from '@app-types/utility';
import { useFetcherFailure } from '@hooks/useFetcherFailure';
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
  const [isAttachingPhoto, setIsAttachingPhoto] = useState(readingEmail.attachment !== null);
  const { register, handleSubmit, formState } = useForm<EmailText>({
    defaultValues: { subject: readingEmail.subject, body: readingEmail.body },
    resolver: yupResolver(EmailTextSchema),
  });
  const fetcher = useFetcher<JSONResponseUtil>();
  const failureMessage = useFetcherFailure(fetcher, FAILURE_MESSAGE);
  const navigate = useNavigate();
  const { search } = useLocation();

  const isMailConnected = layoutData?.mailStatus.state === MailStateUtil.CONNECTED;
  const isSending = fetcher.state !== 'idle';

  // Back to the same page of the history.
  const closePreview = () => void navigate({ pathname: BASE_ROUTES_PATHS.HOME, search });

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
    isSending,
    failureMessage,
    handleOpenChange,
    sendReading,
  };
}
