import { Alert, AlertTitle } from '@components/ui/alert';

type Props = {
  message: string;
};

// A failed write, shown next to the form or dialog that sent it. The Alert is role="alert", so it is read out as
// soon as it shows.
function ErrorAlert({ message }: Props) {
  return (
    <Alert variant="destructive">
      <AlertTitle>{message}</AlertTitle>
    </Alert>
  );
}

export default ErrorAlert;
