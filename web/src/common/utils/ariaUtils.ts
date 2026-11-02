// The ids of everything that describes a control (its hint, its error, a note outside it), as one aria-describedby
// value. Undefined when there are none, so the attribute is left off.
export function describedByIds(...ids: (string | undefined)[]): string | undefined {
  const presentIds = ids.filter((id) => id !== undefined);

  if (presentIds.length === 0) return undefined;

  return presentIds.join(' ');
}
