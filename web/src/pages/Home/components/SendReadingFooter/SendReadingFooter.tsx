import type { ReadingApiModel } from '@app-types/models';
import { ReadingStatusUtil } from '@app-types/utility';
import { CardFooter } from '@components/ui/card';
import SendReadingLink from './components/SendReadingLink';

type Props = {
  reading: ReadingApiModel;
  // The last reading's Send is the page's main action; a history card's is a quieter outline button.
  isProminent?: boolean;
};

// A reading card's footer with Send or Try again, while the reading can still go out. Nothing once it is sent: a
// sent reading cannot be sent again.
function SendReadingFooter({ reading, isProminent = false }: Props) {
  if (reading.status === ReadingStatusUtil.SENT) return null;

  return (
    <CardFooter>
      <SendReadingLink reading={reading} isProminent={isProminent} />
    </CardFooter>
  );
}

export default SendReadingFooter;
