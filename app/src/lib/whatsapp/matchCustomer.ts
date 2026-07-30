import {prisma} from "@/lib/prisma";
import {phoneMatchCandidates} from "@/lib/whatsapp/phone";

export async function findCustomerByWhatsAppPhone(phone: string) {
  const candidates = phoneMatchCandidates(phone);

  if (candidates.length === 0) return null;

  const directCustomer = await prisma.customer.findFirst({
    where: {
      OR: [
        {phone: {in: candidates}},
        {phone: {contains: candidates[0]}},
      ],
    },
    select: {
      id: true,
      name: true,
      phone: true,
    },
  });

  if (directCustomer) return directCustomer;

  const contact = await prisma.buyerContact.findFirst({
    where: {
      OR: [
        {phone: {in: candidates}},
        {phone: {contains: candidates[0]}},
      ],
    },
    select: {
      customer: {
        select: {
          id: true,
          name: true,
          phone: true,
        },
      },
    },
  });

  return contact?.customer || null;
}
