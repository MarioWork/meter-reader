import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import { SidebarRail, useSidebar } from '@components/ui/sidebar';
import { Tooltip, TooltipContent, TooltipTrigger } from '@components/ui/tooltip';

const COLLAPSE_LABEL = 'Collapse sidebar';
const EXPAND_LABEL = 'Expand sidebar';
// The key shadcn's SidebarProvider listens for with Ctrl or ⌘ (SIDEBAR_KEYBOARD_SHORTCUT in ui/sidebar.tsx).
const SHORTCUT_KEY = 'B';
const APPLE_PLATFORM = /Mac|iPhone|iPad/i;
// ⌘ on Apple devices, Ctrl everywhere else.
const MODIFIER_KEY_LABEL = APPLE_PLATFORM.test(navigator.userAgent) ? '⌘' : 'Ctrl';
const SHORTCUT_HINT = `${MODIFIER_KEY_LABEL} ${SHORTCUT_KEY}`;
// Clears the round arrow, which sits half outside the edge.
const TOOLTIP_GAP_PX = 10;

// The sidebar's edge is its collapse / expand button: the thin line between the sidebar and the page. A round arrow
// shows on hover and on keyboard focus so it can be found. shadcn's rail is mouse-only (tabIndex -1), so it is made
// focusable here and named for what it will do; Ctrl/⌘ B does the same from anywhere. 24 px wide (w-6), the minimum
// target size. The arrow sits above the rail's own hover line (z-10), which would otherwise cut through it.
function SidebarEdgeToggle() {
  const { state, toggleSidebar } = useSidebar();
  const isExpanded = state === 'expanded';
  const label = isExpanded ? COLLAPSE_LABEL : EXPAND_LABEL;
  const ArrowIcon = isExpanded ? ChevronLeftIcon : ChevronRightIcon;

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <SidebarRail
            tabIndex={0}
            aria-label={label}
            aria-expanded={isExpanded}
            // Drops shadcn's native title: the tooltip below says the same, and says it on focus too.
            title={undefined}
            onClick={toggleSidebar}
            className="group/rail w-6 outline-none focus-visible:after:bg-ring"
          />
        }
      >
        <span
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 left-1/2 z-10 flex size-6 -translate-1/2 items-center justify-center rounded-full border bg-sidebar text-muted-foreground opacity-0 shadow-xs transition-opacity group-hover/rail:opacity-100 group-focus-visible/rail:opacity-100 group-focus-visible/rail:ring-2 group-focus-visible/rail:ring-ring"
        >
          <ArrowIcon className="size-4" />
        </span>
      </TooltipTrigger>
      <TooltipContent side="right" sideOffset={TOOLTIP_GAP_PX}>
        {label} · {SHORTCUT_HINT}
      </TooltipContent>
    </Tooltip>
  );
}

export default SidebarEdgeToggle;
