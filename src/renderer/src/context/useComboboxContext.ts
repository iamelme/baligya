import { ReferenceType } from "@floating-ui/react";
import { createContext, RefObject, useContext } from "react";

type ContetType = {
  isLoading?: boolean;
  isOpen: boolean;
  setIsOpen: (v: boolean) => void;
  floatingStyles: React.CSSProperties;
  options: Record<string, string>[];
  opt: Record<string, string>[];
  setOpt: (v: ContetType["opt"]) => void;
  refs: {
    reference: RefObject<ReferenceType| HTMLInputElement| null>;
    floating: RefObject<HTMLElement | null>;
    setReference: (node: ReferenceType | null) => void;
    setFloating: (node: HTMLElement | null) => void;
  };
  getReferenceProps: (
    userProps?: React.HTMLProps<Element>,
  ) => Record<string, unknown>;
  getFloatingProps: (
    userProps?: React.HTMLProps<HTMLElement>,
  ) => Record<string, unknown>;
};

export const ComboboxContext = createContext<ContetType | null>(null);

const useComboboxContext = (): ContetType => {
  const ctx = useContext(ComboboxContext);

  if (!ctx) {
    throw new Error("Context must be use inside a compound component");
  }

  return ctx;
};

export default useComboboxContext;
