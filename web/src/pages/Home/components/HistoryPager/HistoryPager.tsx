import { Link } from 'react-router';
import { ApiUrlParamsUtil, PAGE_SIZE } from '@app-types/utility';

type Props = {
  currentPage: number;
  totalResultNumber: number;
};

const LINK_CLASSES = `
  min-h-6 rounded-sm px-2 py-1 text-blue-700 underline
  focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700
`;

// Only the page changes, so the link keeps the current path.
function pageSearch(page: number): string {
  return `?${new URLSearchParams({ [ApiUrlParamsUtil.page]: String(page) }).toString()}`;
}

// Newer pages first: page 1 holds the latest readings.
function HistoryPager({ currentPage, totalResultNumber }: Props) {
  const pageCount = Math.ceil(totalResultNumber / Number(PAGE_SIZE));
  const hasNewer = currentPage > 1;
  const hasOlder = currentPage < pageCount;

  if (pageCount <= 1) return null;

  return (
    <nav aria-label="History pages" className="flex items-center justify-between gap-4">
      {hasNewer ? (
        <Link to={{ search: pageSearch(currentPage - 1) }} className={LINK_CLASSES}>
          Newer readings
        </Link>
      ) : (
        <span />
      )}
      <span className="text-gray-600">
        Page {currentPage} of {pageCount}
      </span>
      {hasOlder ? (
        <Link to={{ search: pageSearch(currentPage + 1) }} className={LINK_CLASSES}>
          Older readings
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}

export default HistoryPager;
