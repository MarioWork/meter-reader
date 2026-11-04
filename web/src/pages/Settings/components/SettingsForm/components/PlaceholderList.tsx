import { MESSAGE_PLACEHOLDERS } from '@utils/messageTemplateUtils';

type Placeholder = { name: string; meaning: string };

const PLACEHOLDERS: Placeholder[] = [
  { name: MESSAGE_PLACEHOLDERS.reading, meaning: 'the reading, as read from the meter' },
  { name: MESSAGE_PLACEHOLDERS.date, meaning: 'the day it was read, written in the date format chosen' },
  { name: MESSAGE_PLACEHOLDERS.client, meaning: 'your client number, as saved above' },
];

// What each placeholder a template can hold turns into, shown just above the templates.
function PlaceholderList() {
  return (
    <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 rounded-lg bg-muted/50 p-3 text-sm">
      {PLACEHOLDERS.map(({ name, meaning }) => (
        <div key={name} className="contents">
          <dt className="font-mono font-medium">{name}</dt>
          <dd className="text-muted-foreground">{meaning}</dd>
        </div>
      ))}
    </dl>
  );
}

export default PlaceholderList;
