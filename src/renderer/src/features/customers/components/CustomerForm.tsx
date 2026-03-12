import FormInput from "@renderer/shared/components/form/FormInput";
import FormTextarea from "@renderer/shared/components/form/FormTextarea";
import Button from "@renderer/shared/components/ui/Button";
import { ReactNode } from "react";

export default function CustomerForm(): ReactNode {
  return (
    <>
      <FormInput name="name" label="Name" required />
      <FormTextarea name="address" label="Address" required />
      <FormInput name="phone" label="Phone" required />
      <Button type="submit">Submit</Button>
    </>
  );
}
