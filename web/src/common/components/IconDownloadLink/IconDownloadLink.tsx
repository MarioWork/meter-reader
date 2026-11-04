import { DownloadIcon } from 'lucide-react';
import { buttonVariants } from '@components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@components/ui/tooltip';
import { cn } from '@utils/classNameUtils';

type Props = {
  href: string;
  // The link's name and its tooltip: there is no visible text.
  label: string;
};

// A download as an icon alone, for a page's header: a plain link the browser downloads the file from, named by its
// label, which also shows as a tooltip on hover and on keyboard focus. Through cn(), so the outline's border colour
// wins over the base's transparent one, as on a Button. 32 px square, over the 24 px minimum target.
function IconDownloadLink({ href, label }: Props) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <a
            href={href}
            download
            aria-label={label}
            className={cn(buttonVariants({ variant: 'outline', size: 'icon' }))}
          />
        }
      >
        <DownloadIcon aria-hidden="true" />
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

export default IconDownloadLink;
