import { customAlphabet } from "nanoid";

// Removed: 0, O, I, l, 1 to prevent confusion when typing manually
const ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz";

// Generates a 10-character secure, URL-safe string
export const generateInviteCode = customAlphabet(ALPHABET, 10);
