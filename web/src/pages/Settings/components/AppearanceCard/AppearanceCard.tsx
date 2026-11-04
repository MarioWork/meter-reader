import { PanelLeftCloseIcon, PanelLeftOpenIcon } from 'lucide-react';
import { SidebarStartUtil } from '@app-types/utility';
import { useSidebarStart } from '@hooks/useSidebarStart';
import { useTheme } from '@hooks/useTheme';
import { THEME_OPTIONS } from '@utils/themeOptionUtils';
import SettingsCard from '../SettingsCard';
import SegmentedChoice, { type SegmentedOption } from './components/SegmentedChoice';

const TITLE = 'Appearance';
const DESCRIPTION = 'Kept on this device, and changed the moment you pick. System follows your device.';
const THEME_LEGEND = 'Theme';
const SIDEBAR_START_LEGEND = 'Sidebar starts';
const SIDEBAR_START_HINT = 'On a computer, each time the app opens.';

const SIDEBAR_START_OPTIONS: SegmentedOption<SidebarStartUtil>[] = [
  { value: SidebarStartUtil.EXPANDED, label: 'Expanded', Icon: PanelLeftOpenIcon },
  { value: SidebarStartUtil.COLLAPSED, label: 'Collapsed', Icon: PanelLeftCloseIcon },
];

// How the app looks on this device: the theme (also in the sidebar and the phone's menu), and how the wide screen's
// sidebar opens (a phone has none). Not part of the email settings: each choice applies and is kept at once, with no
// Save.
function AppearanceCard() {
  const { theme, setTheme } = useTheme();
  const [sidebarStart, setSidebarStart] = useSidebarStart();

  return (
    <SettingsCard title={TITLE} description={DESCRIPTION}>
      <SegmentedChoice legend={THEME_LEGEND} options={THEME_OPTIONS} value={theme} onChange={setTheme} />
      <SegmentedChoice
        legend={SIDEBAR_START_LEGEND}
        options={SIDEBAR_START_OPTIONS}
        value={sidebarStart}
        onChange={setSidebarStart}
        hint={SIDEBAR_START_HINT}
      />
    </SettingsCard>
  );
}

export default AppearanceCard;
