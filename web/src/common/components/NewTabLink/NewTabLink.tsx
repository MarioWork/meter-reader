import { ExternalLinkIcon } from 'lucide-react';

type Props = {
  href: string;
  // Starts with the word the link shows (WCAG 2.5.3) and says it opens a new tab.
  accessibleName: string;
  className: string;
  children: React.ReactNode;
};

const NEW_TAB = '_blank';
// The new tab gets no handle on this one.
const NEW_TAB_REL = 'noopener noreferrer';

// A link that opens in a new tab, with the icon that says so: a bill in the browser's own viewer, for one.
function NewTabLink({ href, accessibleName, className, children }: Props) {
  return (
    <a className={className} href={href} target={NEW_TAB} rel={NEW_TAB_REL} aria-label={accessibleName}>
      <ExternalLinkIcon data-icon="inline-start" aria-hidden="true" />
      {children}
    </a>
  );
}

export default NewTabLink;
