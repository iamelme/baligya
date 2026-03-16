import {
  ChangeEvent,
  InputHTMLAttributes,
  ReactNode,
  useEffect,
  useState,
} from "react";
import { useFloating, useFocus, useInteractions } from "@floating-ui/react";
import Input from "./Input";
import useComboboxContext, {
  ComboboxContext,
} from "../../../context/useComboboxContext";
import { twMerge } from "tailwind-merge";

type ComboboxProps = {
  isLoading?: boolean;
  options: Record<string, string>[];
  children: ReactNode;
};

export default function Combobox({
  isLoading,
  options,
  children,
}: ComboboxProps): React.ReactElement {
  const [isOpen, setIsOpen] = useState(false);

  const { refs, floatingStyles, context } = useFloating({
    open: isOpen,
    onOpenChange: setIsOpen,
  });

  const [opt, setOpt] = useState(options);

  useEffect(() => {
    setOpt(options);
  }, [options]);

  const focus = useFocus(context);

  const { getReferenceProps, getFloatingProps } = useInteractions([focus]);
  return (
    <ComboboxContext
      value={{
        isOpen,
        setIsOpen,
        options,
        opt,
        setOpt,
        refs,
        floatingStyles,
        getReferenceProps,
        getFloatingProps
      }}
    >
      <div className="relative">{children}</div>
    </ComboboxContext>
  )
}

function Search({ ...props }: InputHTMLAttributes<HTMLInputElement>): ReactNode {
  const { refs, getReferenceProps, isOpen, options, setOpt } = useComboboxContext()

  const handleSearch = (e: ChangeEvent<HTMLInputElement>): void => {
    const { value } = e.target

    if (!value.trim()) {
      setOpt(options)

      return
    }

    const filterOpt = options.filter((o) => o.label.toLowerCase().includes(value.toLowerCase()))
    setOpt(filterOpt)
  }
    props?.onChange?.(e);
  };

  return (
    <Input
      ref={refs.setReference}
      {...props}
      {...getReferenceProps()}
      className={twMerge(props.className, `${isOpen ? 'rounded-b-none' : ''}`)}
      onChange={handleSearch}
    />
  )
}

function Empty({ children }: { children?: ReactNode }): ReactNode {
  return <p>{children || 'No Content'}</p>
}

function List({ onSelect }: { onSelect: (v: string) => void }): React.ReactElement {
  const { isOpen, setIsOpen, refs, floatingStyles, getFloatingProps, opt } = useComboboxContext()
  return (
    <>
      {isOpen && (
        <div
          ref={refs.setFloating}
          style={floatingStyles}
          {...getFloatingProps()}
          className="w-full p-1 bg-white border rounded-b-md"
        >
          <ul>
            {opt?.map((o) => (
              <li
                key={o.value}
                onClick={() => {
                  onSelect(o.value)
                  setIsOpen(!isOpen)
                }}
              >
                {o.label}
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  )
}

Combobox.Input = Search
Combobox.Empty = Empty
Combobox.List = List
