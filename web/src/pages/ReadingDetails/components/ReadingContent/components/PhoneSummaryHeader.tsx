import ReadingSendAction from '../../ReadingSendAction';
import ReadingPageMenu from './ReadingPageMenu';
import ReadingTitle from './ReadingTitle';

// A phone's title row: the day and its status, with the send action (an icon, while it can still go) and the "⋯"
// menu at its end.
function PhoneSummaryHeader() {
  return (
    <header className="flex items-start justify-between gap-3">
      <ReadingTitle />
      <div className="flex shrink-0 items-center gap-1">
        <ReadingSendAction />
        <ReadingPageMenu />
      </div>
    </header>
  );
}

export default PhoneSummaryHeader;
