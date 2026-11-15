// Business rules for customer bookings, in one place.
export const MAX_SEATS_PER_BOOKING = 8;

// Simulated payment: a card number ending in this is "declined".
// Every other card is "approved". No real payment gateway is involved.
export const DECLINED_CARD_SUFFIX = "0002";
