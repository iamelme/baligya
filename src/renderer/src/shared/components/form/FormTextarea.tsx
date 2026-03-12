import { ReactNode, TextareaHTMLAttributes } from "react";
import { useFormContext } from "react-hook-form";
import Textarea from "../ui/Textarea";

type FormTextareaProps = {
  name: string;
  label?: string;
  variant?: "default" | "row";
} & TextareaHTMLAttributes<HTMLTextAreaElement>;

export default function FormTextarea({
  name,
  label,
  variant = "row",
  required,
}: FormTextareaProps): ReactNode {
  const {
    register,
    formState: { errors },
  } = useFormContext();

  return (
    <div
      className={`${variant === "row" ? "md:grid grid-cols-7 gap-x-5" : ""} mb-4`}
    >
      {label && (
        <div className="col-span-3">
          <label
            htmlFor={name}
            className={`flex mb-1 font-medium text-md ${errors[name] ? "text-red-500" : ""}`}
          >
            {label} {required ? <span className="text-red-500">*</span> : null}
          </label>
        </div>
      )}
      <div className="col-span-4">
        <Textarea {...register(name)} />
      </div>
    </div>
  );
}
