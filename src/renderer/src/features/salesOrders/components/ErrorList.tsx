import Alert from "@renderer/shared/components/ui/Alert";

type Params = {
  errors: Record<string, string[]>;
};

export default function ErrorList({ errors }: Params) {
  console.log({ errors });
  return (
    <Alert variant="danger">
      <ul>
        {Object.keys(errors)?.map((key) => (
          <li key={key}>{errors[key]}</li>
        ))}
      </ul>
    </Alert>
  );
}
