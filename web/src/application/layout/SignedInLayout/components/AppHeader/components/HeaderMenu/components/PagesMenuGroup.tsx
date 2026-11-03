import { ChartColumnIcon, SettingsIcon } from 'lucide-react';
import { Link } from 'react-router';
import { SETTINGS_ROUTES_PATHS } from '@application/routes/routesUtils';
import { DropdownMenuGroup, DropdownMenuItem } from '@components/ui/dropdown-menu';
import { thisYearCostsPath } from '@utils/historyFilterUtils';

// The app's other pages. A menu item that goes somewhere is a link, so it opens in a new tab too.
function PagesMenuGroup() {
  return (
    <DropdownMenuGroup>
      <DropdownMenuItem render={<Link to={thisYearCostsPath()} />}>
        <ChartColumnIcon />
        Costs
      </DropdownMenuItem>
      <DropdownMenuItem render={<Link to={SETTINGS_ROUTES_PATHS.BASE} />}>
        <SettingsIcon />
        Settings
      </DropdownMenuItem>
    </DropdownMenuGroup>
  );
}

export default PagesMenuGroup;
