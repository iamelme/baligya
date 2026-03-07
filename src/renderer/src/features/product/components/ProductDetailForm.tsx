import { ReactNode } from "react";
import FormCombobox from '@renderer/shared/components/form/FormCombobox'
import FormInput from '@renderer/shared/components/form/FormInput'
import Alert from '@renderer/shared/components/ui/Alert'
import Button from '@renderer/shared/components/ui/Button'

type Props = {
  categoryOptions?: { label: string, value: string }[]
  errorMessage?: string
}

export default function ProductDetailForm({ categoryOptions, errorMessage }: Props): ReactNode {

  return (
    <>
      <FormInput type="hidden" label="" name="inventory_id" />
      <FormInput label="Name" name="name" helpertext="Product Name" required />
      <FormInput label="SKU" name="sku" fieldWatch="name" helpertext="This will turn to uppercase after saving." required />
      <FormInput label="Code" name="code" required />
      <FormInput label="Description" name="description" />
      <FormInput label="Price" name="price" required />
      <FormInput label="Cost" name="cost" required />
      <FormCombobox label="Category" name="category_id" options={categoryOptions ?? []} required />
      {errorMessage && (
        <Alert variant="danger" className="mt-3">
          {errorMessage}
        </Alert>
      )}
      <Button type="submit" className="mt-4">
        Save
      </Button>
    </>
  )
}
