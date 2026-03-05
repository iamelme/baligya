import { ReactNode } from "react";
import FormInput from "@renderer/shared/components/form/FormInput";
import Button from "@renderer/shared/components/ui/Button";

export default function SystemForm(): ReactNode {
  return (
    <>
      <FormInput
        name="tax"
        label="Tax rate"
        helperText="Lorem ipsum"
        required
      />
      {/*

      <FormInput
        type="checkbox"
        name="is_tax_inclusive"
        label="Tax Inclusive"
        helperText="Displayed price of a product already includes all applicable taxes "
      />
          */}
      <FormInput
        type="checkbox"
        name="is_redirect_to_sales"
        label="Redirect to Sales Invoice"
        helperText="After placing an order the page will be redirected to sales invoice"
      />
      <Button type="submit">Submit</Button>
    </>
  );
}
