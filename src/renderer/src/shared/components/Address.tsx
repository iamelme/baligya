import { ReactNode } from "react";

type Props = {
  title?: ReactNode;
  address: string;
};

export default function Address({ title, address }: Props): ReactNode {
  return (
    <>
      {title ? <h3>{title}</h3> : null}
      <address className="whitespace-pre">{address}</address>
    </>
  );
}
