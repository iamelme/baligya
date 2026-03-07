import { useFormContext } from "react-hook-form";
import Input from "../ui/Input";
import { InputHTMLAttributes, useEffect } from "react";
import Alert from "../ui/Alert";

type FormInputProps = {
  name: string;
  label?: string;
  helpertext?: string;
  variant?: "default" | "row";
  fieldWatch?: string;
} & InputHTMLAttributes<HTMLInputElement>;
// } & DetailedHTMLProps<HTMLAttributes<HTMLInputElement>, HTMLInputElement>

export default function FormInput({
  name,
  label,
  variant = "row",
  fieldWatch,
  ...props
}: FormInputProps): React.JSX.Element {
  const {
    register,
    formState: { errors },
    watch,
    setValue,
  } = useFormContext();

  let fieldValue = "";
  if (fieldWatch) {
    fieldValue = watch(fieldWatch);
  }

  useEffect(() => {
    if (fieldValue) {
      setValue(name, fieldValue);
    }
  }, [name, setValue, fieldValue]);

  return (
    <div
      className={`${variant === "row" ? "md:grid grid-cols-7 gap-x-5" : ""} mb-4`}
    >
      {label && (
        <div className="col-span-3">
          <label
            className={`flex mb-1 font-medium text-md ${errors[name] ? "text-red-500" : ""}`}
            htmlFor={name}
          >
            {label} {props.required && <span className="text-red-500">*</span>}
          </label>
          {props?.helpertext && (
            <p className="text-xs text-slate-500">{props.helpertext}</p>
          )}
        </div>
      )}
      <div className="col-span-4">
        {props.type === "checkbox" ? (
          <label
            htmlFor={name}
            className={`relative inline-flex items-center font-medium text-xs ${errors[name] ? "text-red-500" : ""} cursor-pointer`}
          >
            <Input
              id={name}
              {...register(name)}
              {...props}
              className={`${errors[name] ? "border-red-400" : ""} sr-only peer ${label ? "mr-1" : ""}`}
            />

            <div className="w-11 h-6 bg-gray-200 rounded-full peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
          </label>
        ) : (
          <Input
            id={name}
            {...register(name)}
            {...props}
            className={`${errors[name] ? "border-red-400" : ""}`}
          />
        )}

        {errors[name] && (
          <Alert variant="danger" className="mt-2 text-xs">
            {String(errors[name]?.message)}
          </Alert>
        )}
      </div>
    </div>
  );
}
