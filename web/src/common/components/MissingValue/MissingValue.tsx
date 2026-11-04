type Props = {
  // What a screen reader hears instead of the dash: "No cost", "No bill".
  label: string;
};

const DASH = '—';

// An empty cell, as a quiet dash on screen; a screen reader hears what is missing instead of nothing at all.
function MissingValue({ label }: Props) {
  return (
    <>
      <span aria-hidden="true" className="text-muted-foreground">
        {DASH}
      </span>
      <span className="sr-only">{label}</span>
    </>
  );
}

export default MissingValue;
