import { ReactNode, Ref } from "react";
import { twMerge } from "tailwind-merge";

type HasCheckBox = {
  hasCheckBox: true;
  onSelectAll: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSelect: (
    id: string | number,
  ) => (e: React.ChangeEvent<HTMLInputElement>) => void;
  selected: Map<string, { isChecked: boolean }>;
};

type ItemsProps<T extends { id: string | number }> = {
  items: T[] | undefined;
  headers: { label?: string; className?: string }[];
  renderItems: (item: T) => ReactNode;
  ref?: Ref<HTMLTableElement>;
} & (
  | HasCheckBox
  | {
      hasCheckBox?: undefined | false | never;
      onSelectAll?: never;
      onSelect?: never;
      selected?: never;
    }
);

export default function Items<T extends { id: string | number }>({
  hasCheckBox,
  onSelectAll,
  onSelect,
  selected,
  headers,
  items,
  renderItems,
  ref,
}: ItemsProps<T>): ReactNode {
  // console.log({ itemsSize: selected?.size, selected })
  // console.log([...(selected?.keys() || [])])

  const keys = [...(selected?.keys() || [])];

  if (items === undefined || !items?.length) {
    return;
  }

  return (
    <div className="">
      <table className="w-full border border-slate-100" ref={ref}>
        <thead>
          <tr className="sticky top-0 bg-white">
            {hasCheckBox && (
              <th className="py-4 px-2 text-left">
                <input
                  type="checkbox"
                  checked={selected.size === items.length && items.length > 0}
                  onChange={onSelectAll}
                />
              </th>
            )}
            {headers?.map((header, idx) => (
              <th
                key={idx}
                className={twMerge(
                  `py-4 px-2 text-xs uppercase font-medium text-left text-slate-400 ${header.className}`,
                )}
              >
                {header?.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="[&_td]:py-1 [&_td]:px-2 align-top">
          {items?.map((item, idx) => (
            <tr
              key={item.id}
              data-selected="0"
              className="border-t border-slate-100 even:bg-white [&>td]:py-3"
              tabIndex={0}
            >
              {hasCheckBox && (
                <td className="text-left">
                  <input
                    key={selected?.keys()?.next().value || keys[idx]}
                    type="checkbox"
                    onChange={onSelect(item.id)}
                    checked={selected?.get(`${item.id}`)?.isChecked}
                  />
                </td>
              )}
              {renderItems(item)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
