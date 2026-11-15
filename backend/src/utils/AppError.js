// Error class for problems we expect (wrong input, not found, forbidden...).
// Throw it anywhere; the central error handler turns it into a JSON response.
//   details: extra data for the client (field errors, unavailable seats...)
//   code:    a stable machine-readable name, e.g. "SEATS_UNAVAILABLE", so the
//            frontend can react without parsing the message text.
export class AppError extends Error {
  constructor(message, statusCode = 500, details = null, code = null) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.details = details;
    this.code = code;
  }
}
