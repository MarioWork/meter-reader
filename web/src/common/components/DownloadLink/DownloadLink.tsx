import { DownloadIcon } from 'lucide-react';
import { buttonVariants } from '@components/ui/button';

type Props = {
  href: string;
  label: string;
  // When the label alone does not say what is downloaded. Starts with the label (WCAG 2.5.3), so a voice command
  // naming what is on screen still finds it.
  accessibleName?: string;
};

// A plain link styled as a button: the browser downloads the file the API sends, nothing for React to render, and the
// page stays where it is.
function DownloadLink({ href, label, accessibleName }: Props) {
  return (
    <a href={href} download aria-label={accessibleName} className={buttonVariants({ variant: 'outline' })}>
      <DownloadIcon data-icon="inline-start" aria-hidden="true" />
      {label}
    </a>
  );
}

export default DownloadLink;
