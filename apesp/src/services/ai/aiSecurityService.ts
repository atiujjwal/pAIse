export class AiSecurityService {
  /**
   * Sanitizes input to prevent basic injection attacks and token exhaustion.
   */
  static sanitizeInput(input: string): string {
    if (!input) return "";
    let sanitized = input.replace(/[{}]/g, "").trim();
    if (sanitized.length > 1000) {
      sanitized = sanitized.slice(0, 1000);
    }

    return sanitized;
  }
}
