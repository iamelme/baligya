import { ReactNode } from "react";
import FormInput from "@renderer/shared/components/form/FormInput";
import Button from "@renderer/shared/components/ui/Button";
import FormTextarea from "@renderer/shared/components/form/FormTextarea";

export default function GeneralForm(): ReactNode {
  return (
    <>
      <div className="h-1 border-t border-slate-200 mb-4"></div>
      <h3 className="font-medium mb-4 text-slate-400">Company Profile</h3>
      <FormInput name="company_name" label="Company Name" required />
      <FormTextarea name="address1" label="Address 1" required />
      <FormInput name="state_province" label="State/Province" required />
      <FormInput name="city" label="City" required />
      <FormInput name="zip" label="Postal Code" required />
      <FormInput name="phone" label="Phone" helpertext="" required />

      <div className="h-1 border-t border-slate-200 mb-4"></div>

      <FormInput
        name="locale"
        label="Locale"
        required
        helpertext="This will be used for currency"
      />
      <FormInput name="tax" label="Tax rate" required />
      {/*

      <FormInput
        type="checkbox"
        name="is_tax_inclusive"
        label="Tax Inclusive"
        helpertext="Displayed price of a product already includes all applicable taxes "
      />
          */}
      <FormInput
        type="checkbox"
        name="is_redirect_to_sales"
        label="Redirect to Sales Invoice"
        helpertext="After placing an order the page it will be redirected to sales invoice"
      />
      <Button type="submit">Submit</Button>
    </>
  );
}
