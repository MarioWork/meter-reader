import { DownloadIcon } from 'lucide-react';
import { buttonVariants } from '@components/ui/button';

type Props = {
  href: string;
  label: string;
};

// A plain link styled as a button: the browser downloads the file the API sends, nothing for React to render.
function DownloadLink({ href, label }: Props) {
  return (
    <a href={href} download className={buttonVariants({ variant: 'outline' })}>
      <DownloadIcon data-icon="inline-start" aria-hidden="true" />
      {label}
    </a>
  );
}

export default DownloadLink;
