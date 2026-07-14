type EmailContent = {subject: string; text: string; html: string};

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;",
  })[character] || character);
}

function content(subject: string, lines: Array<string | null | undefined>): EmailContent {
  const clean = lines.filter((line): line is string => Boolean(line));
  return {
    subject,
    text: clean.join("\n\n"),
    html: clean.map((line) => `<p>${escapeHtml(line).replace(/\n/g, "<br>")}</p>`).join(""),
  };
}

export const emailTemplates = {
  contactAcknowledgement: (name: string) => content("We received your OneFarmTech enquiry", [
    `Hello ${name},`, "Your enquiry has been received. Our team will review it and follow up using the details you provided.", "OneFarmTech",
  ]),
  contactAdmin: (name: string, type: string, message: string, url: string) => content(`New contact enquiry: ${type}`, [
    `From: ${name}`, `Type: ${type}`, message, `Review: ${url}/admin/contact-enquiries`,
  ]),
  accountRequestAcknowledgement: (name: string) => content("Your OneFarmTech buyer-account request", [
    `Hello ${name},`, "We received your buyer-account request. The team will review it and contact you with the next step.", "OneFarmTech",
  ]),
  accountRequestAdmin: (name: string, organisation: string | null, url: string) => content("New buyer-account request", [
    `Contact: ${name}`, organisation ? `Organisation: ${organisation}` : null, `Review: ${url}/admin/buyer-account-requests`,
  ]),
  buyerInvite: (name: string, code: string, url: string) => content("Your OneFarmTech buyer access code", [
    `Hello ${name},`, `Access code: ${code}`, `Sign in: ${url}/buyer-login`, "Keep this code private. It is linked to your approved buyer account.",
  ]),
  orderRequestAcknowledgement: (name: string) => content("Your OneFarmTech order request", [
    `Hello ${name},`, "We received your order request. The team will confirm availability, pricing, payment and fulfilment details.", "OneFarmTech",
  ]),
  orderRequestAdmin: (name: string, items: string, url: string) => content("New public order request", [
    `Buyer: ${name}`, `Items: ${items}`, `Review: ${url}/admin/order-requests`,
  ]),
  paymentRequest: (name: string, orderCode: string, amount: string, paymentUrl: string | null, url: string) => content(`Payment request for ${orderCode}`, [
    `Hello ${name},`, `Amount: ${amount}`, paymentUrl ? `Pay securely: ${paymentUrl}` : "The team will confirm payment instructions.", `View order: ${url}/buyer-account/orders`,
  ]),
  paymentConfirmation: (name: string, orderCode: string, amount: string, url: string) => content(`Payment received for ${orderCode}`, [
    `Hello ${name},`, `We confirmed your payment of ${amount}.`, `View payments: ${url}/buyer-account/payments`,
  ]),
  receiptIssued: (name: string, receiptCode: string, amount: string, url: string) => content(`Receipt ${receiptCode}`, [
    `Hello ${name},`, `Your receipt for ${amount} has been issued.`, `View receipt: ${url}/buyer-account`,
  ]),
  orderStatus: (name: string, orderCode: string, status: string, url: string) => content(`Order ${orderCode} update`, [
    `Hello ${name},`, `Your order status is now: ${status}.`, `View order: ${url}/buyer-account/orders`,
  ]),
  deliveryStatus: (name: string, status: string, url: string) => content("Delivery update", [
    `Hello ${name},`, `Your delivery status is now: ${status}.`, `View order: ${url}/buyer-account/orders`,
  ]),
};

export type TransactionalEmail = EmailContent;
