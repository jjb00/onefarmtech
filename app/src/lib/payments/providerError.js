const SECRET_PATTERN = /(authorization|secret|token|key|signature|hash|access_code)\s*[=:]\s*[^,}\s]+/gi;

export function redactProviderMessage(value, fallback) {
  const message = typeof value === "string" ? value : fallback;
  return message.replace(SECRET_PATTERN, "$1=<redacted>").replace(/[\r\n]+/g, " ").slice(0, 500);
}

export class PaymentProviderError extends Error {
  /**
   * @param {{provider: "Paystack" | "Flutterwave", code: string, message: string, httpStatus?: number | null}} input
   */
  constructor({provider, code, message, httpStatus = null}) {
    super(redactProviderMessage(message, `${provider} payment initialisation failed.`));
    this.name = "PaymentProviderError";
    this.provider = provider;
    this.code = code;
    this.httpStatus = httpStatus;
  }
}

export function providerFailureDetails(error, provider) {
  if (error instanceof PaymentProviderError) {
    return {provider: error.provider, code: error.code, httpStatus: error.httpStatus, message: error.message};
  }
  return {
    provider,
    code: "provider-failed",
    httpStatus: null,
    message: redactProviderMessage(error instanceof Error ? error.message : null, `${provider} payment initialisation failed.`),
  };
}
