// Placeholder email sender for donations/messages.
export type DonationPayload = {
  amount: number;
  name?: string;
  email?: string;
  message?: string;
};

export async function sendDonationEmail(_payload: DonationPayload) {
  // TODO: Integrate with email service (e.g., SendGrid/Resend)
  return true;
}
