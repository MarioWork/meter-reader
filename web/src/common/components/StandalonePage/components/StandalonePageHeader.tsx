import { CardDescription, CardHeader, CardTitle } from '@components/ui/card';

type Props = {
  title: string;
  description?: string;
};

// The card's header. The title is the page's only h1.
function StandalonePageHeader({ title, description }: Props) {
  return (
    <CardHeader>
      <CardTitle>
        <h1 className="text-xl">{title}</h1>
      </CardTitle>
      {description && <CardDescription>{description}</CardDescription>}
    </CardHeader>
  );
}

export default StandalonePageHeader;
