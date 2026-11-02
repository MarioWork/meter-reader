import { ApiUrlParamsUtil, PAGE_SIZE } from '@app-types/utility';
import TextLink from '@components/TextLink';

type Props = {
  currentPage: number;
  totalResultNumber: number;
};

// Only the page changes, so the link keeps the current path.
function pageSearch(page: number): string {
  return `?${new URLSearchParams({ [ApiUrlParamsUtil.page]: String(page) }).toString()}`;
}

// Newer pages first: page 1 holds the latest readings. The links sit at either end, the page count in the middle.
function HistoryPager({ currentPage, totalResultNumber }: Props) {
  const pageCount = Math.ceil(totalResultNumber / Number(PAGE_SIZE));
  const hasNewer = currentPage > 1;
  const hasOlder = currentPage < pageCount;

  if (pageCount <= 1) return null;

  return (
    <nav aria-label="History pages" className="grid grid-cols-3 items-center gap-4">
      <div>{hasNewer && <TextLink to={{ search: pageSearch(currentPage - 1) }}>Newer readings</TextLink>}</div>
      <p className="text-center text-muted-foreground">
        Page {currentPage} of {pageCount}
      </p>
      <div className="flex justify-end">
        {hasOlder && <TextLink to={{ search: pageSearch(currentPage + 1) }}>Older readings</TextLink>}
      </div>
    </nav>
  );
}

export default HistoryPager;
