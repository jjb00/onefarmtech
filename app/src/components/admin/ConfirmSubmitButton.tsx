"use client";
import {useFormStatus} from "react-dom";
export default function ConfirmSubmitButton({label, pendingLabel, confirmMessage, disabled = false, className = ""}: {label: string; pendingLabel?: string; confirmMessage?: string; disabled?: boolean; className?: string}) {
  const {pending} = useFormStatus();
  return <button type="submit" disabled={disabled || pending} onClick={(event) => { if (confirmMessage && !window.confirm(confirmMessage)) event.preventDefault(); }} className={className}>{pending ? (pendingLabel || "Working…") : label}</button>;
}
