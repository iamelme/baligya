import {
  ButtonHTMLAttributes,
  createContext,
  HTMLAttributes,
  ReactNode,
  RefObject,
  useContext,
  useRef,
} from "react";
import Button, { type ButtonProps } from "./Button";
import { twMerge } from "tailwind-merge";

type DialogContextType = {
  dialogRef: RefObject<HTMLDialogElement | null>;
};

const DialogContext = createContext<DialogContextType | null>(null);

export default function Dialog({
  children,
}: {
  children: ReactNode;
}): ReactNode {
  const dialogRef = useRef<HTMLDialogElement | null>(null);

  return <DialogContext value={{ dialogRef }}>{children}</DialogContext>;
}

const useDialogContext = (): DialogContextType => {
  const ctx = useContext(DialogContext);

  if (!ctx) {
    throw new Error("Component should be inside the context");
  }

  return ctx;
};

function Trigger(
  props: ButtonHTMLAttributes<HTMLButtonElement> &
    Omit<ButtonProps, "children">,
): ReactNode {
  const { dialogRef } = useDialogContext();
  const handleClick = (): void => {
    console.log({ ref: dialogRef.current });
    if (dialogRef.current) {
      if (!dialogRef.current.open) {
        dialogRef.current.showModal();
        return;
      }
      dialogRef.current.close();
    }
  };

  return (
    <Button onClick={handleClick} {...props}>
      {props.children}
    </Button>
  );
}

function Close(
  props: ButtonHTMLAttributes<HTMLButtonElement> &
    Omit<ButtonProps, "children">,
): ReactNode {
  const { dialogRef } = useDialogContext();
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>): void => {
    console.log("dialogRef.current", dialogRef.current);

    if (props.onClick) {
      props?.onClick?.(e);
    }
    if (dialogRef.current) {
      dialogRef.current.close();
    }
  };

  return (
    <Button {...props} onClick={handleClick} type="button">
      {props.children}
    </Button>
  );
}

function Header({ children }: { children: ReactNode }): ReactNode {
  return (
    <header className="flex justify-between py-4 px-3 border-b-1 border-slate-300">
      {children}
    </header>
  );
}

function Body({ children }: { children: ReactNode }): ReactNode {
  return <footer className="py-4 px-3">{children}</footer>;
}

function Footer({ children }: { children: ReactNode }): ReactNode {
  return (
    <footer className="flex justify-end gap-x-2 p-3 border-t-1 border-slate-300">
      {children}
    </footer>
  );
}

type ContentProps = HTMLAttributes<HTMLDialogElement>;

function Content({
  children,
  className,
  ...props
}: ContentProps & { children: ReactNode }): ReactNode {
  const { dialogRef } = useDialogContext();

  const handleClose = (e: React.MouseEvent<HTMLDialogElement>): void => {
    if (e.target === dialogRef.current) {
      dialogRef.current?.close();
    }
  };

  return (
    <dialog
      ref={dialogRef}
      {...props}
      onClick={handleClose}
      className={twMerge(
        "w-full backdrop:bg-slate-600 backdrop:opacity-50 backdrop:backdrop-blur-md m-auto rounded-md",
        className,
      )}
    >
      {children}
    </dialog>
  );
}

Dialog.Trigger = Trigger;
Dialog.Header = Header;
Dialog.Body = Body;
Dialog.Footer = Footer;
Dialog.Content = Content;
Dialog.Close = Close;
