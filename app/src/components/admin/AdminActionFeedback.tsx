const defaults: Record<string, string> = {
  success: "Action completed successfully.", updated: "Changes saved successfully.",
  validation: "Check the information entered and try again.", forbidden: "You do not have permission to perform this action.",
  provider: "The external provider rejected the request.", database: "The record could not be saved.", retry: "The action needs to be retried.", failed: "The action could not be completed.",
};

export default function AdminActionFeedback({success, error, detail, messages = {}}: {success?: string; error?: string; detail?: string; messages?: Record<string, string>}) {
  const code = error || success; if (!code) return null;
  const isError = Boolean(error); const message = messages[code] || defaults[code] || (isError ? defaults.failed : defaults.success);
  return <div role={isError ? "alert" : "status"} className={`rounded-2xl border p-4 text-sm font-bold ${isError ? "border-red-200 bg-red-50 text-red-700" : "border-[#1f7a3f]/20 bg-[#eef8ef] text-[#155c2f]"}`}>{message}{detail ? <span className="mt-1 block font-normal">{detail}</span> : null}</div>;
}
