type Props = {
  message: string;
};

// A failed submit, next to its form. role="alert" reads it out as soon as it shows.
function FormAlert({ message }: Props) {
  return (
    <p role="alert" className="text-destructive">
      {message}
    </p>
  );
}

export default FormAlert;
