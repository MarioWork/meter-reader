import ReadingSendAction from '../../ReadingSendAction';
import ReadingPageMenu from './ReadingPageMenu';

// On the title's right on a wide screen: the send action, then the "⋯" menu.
function WideHeaderActions() {
  return (
    <div className="flex items-center gap-2">
      <ReadingSendAction />
      <ReadingPageMenu />
    </div>
  );
}

export default WideHeaderActions;
