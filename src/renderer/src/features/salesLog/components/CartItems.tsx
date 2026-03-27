import { ReactNode, RefObject } from 'react'
import { Edit, X } from 'react-feather'
import { NumericFormat } from 'react-number-format'
import { Link } from 'react-router-dom'
import Items from '@renderer/shared/components/Items'
import Button from '@renderer/shared/components/ui/Button'
import Dialog from '@renderer/shared/components/ui/Dialog'
import Input from '@renderer/shared/components/ui/Input'
import Price from '@renderer/shared/components/ui/Price'
import { CartItemType } from '@renderer/shared/utils/types'

const headers = [
  { label: 'Name', className: '' },
  { label: 'SKU', className: '' },
  { label: 'Code', className: '' },
  { label: 'Qty', className: '' },
  { label: 'Price', className: 'text-right' },
  { label: '', className: 'text-right' }
]

type ItemsProp = {
  items: CartItemType[]
  onBtnRef: (item: CartItemType, el: HTMLElement | null) => void
  btnUpdateQtyRef: RefObject<Record<number, { quantity: number }>>
  onUpdateItemQty: (id: number) => void
  onRemoveItem: (id: number) => void
}

export default function CartItems({
  items,
  btnUpdateQtyRef,
  onBtnRef,
  onUpdateItemQty,
  onRemoveItem
}: ItemsProp): ReactNode {
  return (
    <div className="mb-3">
      <Items
        items={items}
        headers={headers}
        renderItems={(item) => (
          <>
            <td>
              <Link to={`/products/${item.product_id}`} tabIndex={-1}>
                {item.name}
              </Link>
            </td>
            <td>{item.sku}</td>
            <td>{item.code}</td>
            <td className="">{item.quantity}</td>
            <td className="text-right">
              <Price value={item.price} />
            </td>
            <td>
              <div className="flex gap-x-2 justify-end">
                <Dialog>
                  <Dialog.Trigger ref={(el) => onBtnRef(item, el)} size="icon" variant="outline">
                    <Edit size={12} />
                  </Dialog.Trigger>
                  <Dialog.Content className="max-w-[300px]">
                    <form
                      onSubmit={(e) => {
                        e.preventDefault()
                        // mutationUpdateItemQty.mutate(item.id)
                        onUpdateItemQty(item.id)
                      }}
                    >
                      <Dialog.Header>
                        <h3>{item.name}</h3> <strong>Stock(s): {item.product_quantity}</strong>
                      </Dialog.Header>
                      <Dialog.Body>
                        <NumericFormat
                          value={item.quantity}
                          customInput={Input}
                          onValueChange={(values) => {
                            const { floatValue } = values

                            if (floatValue && btnUpdateQtyRef.current) {
                              if (Number(floatValue) > item.product_quantity) {
                                btnUpdateQtyRef.current[item.id].quantity = item.product_quantity
                                return
                              }
                              btnUpdateQtyRef.current[item.id].quantity = Number(floatValue || 1)
                            }
                          }}
                          thousandSeparator
                          className="text-right"
                        />
                      </Dialog.Body>
                      <Dialog.Footer>
                        <Dialog.Close type="button" variant="outline" size="sm">
                          Close
                        </Dialog.Close>
                        <Button type="submit" className="sm" size="sm">
                          Update
                        </Button>
                      </Dialog.Footer>
                    </form>
                  </Dialog.Content>
                </Dialog>
                <Button variant="outline" size="icon" onClick={() => onRemoveItem(item.id)}>
                  <X size={12} />
                </Button>
              </div>
            </td>
          </>
        )}
      />
    </div>
  )
}
