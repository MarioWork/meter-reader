type Props = {
  label: string;
};

// A sidebar item's visible label. Collapsed to icons it is hidden from sight but kept as the item's name for screen
// readers; the item's tooltip shows it instead.
function SidebarItemLabel({ label }: Props) {
  return <span className="group-data-[collapsible=icon]:sr-only">{label}</span>;
}

export default SidebarItemLabel;
