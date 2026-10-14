/**
 * Validation utilities for User Authentication & Registration
 * UIP (Urban Intelligence Platform)
 */

/**
 * Validates a full name according to requirements:
 * - Minimum length: 4 characters
 * - Cannot start or end with a number or special character
 * - Cannot contain any numerical or special character values (only letters and spaces allowed)
 */
export function validateFullName(name) {
  if (!name || typeof name !== 'string' || !name.trim()) {
    return 'Full name is required.';
  }

  const trimmed = name.trim();

  const firstChar = trimmed[0];
  const lastChar = trimmed[trimmed.length - 1];

  // 1. Check start character
  if (/[0-9]/.test(firstChar)) {
    return 'Full name cannot start with a number.';
  }
  if (!/^[a-zA-Z]$/.test(firstChar)) {
    return 'Full name cannot start with a special character.';
  }

  if (trimmed.length < 4) {
    return 'Full name must be at least 4 characters.';
  }

  // 2. Check end character
  if (/[0-9]/.test(lastChar)) {
    return 'Full name cannot end with a number.';
  }
  if (!/^[a-zA-Z]$/.test(lastChar)) {
    return 'Full name cannot end with a special character.';
  }

  // 3. Check for any numerical values
  if (/[0-9]/.test(trimmed)) {
    return 'Full name cannot contain any numbers.';
  }

  // 4. Check for any special characters (strictly letters and spaces allowed)
  if (/[^a-zA-Z\s]/.test(trimmed)) {
    return 'Full name cannot contain special characters (only letters and spaces allowed).';
  }

  return null; // Valid
}

/**
 * Validates real-world email addresses:
 * - Requires standard structure (username@domain.extension)
 * - Username must be 2-64 characters, start/end with letter or number, no consecutive dots
 * - Domain must have valid labels (min 2 chars each) and a strictly alphabetic TLD (min 2 letters)
 * - Rejects dummy, temporary, and placeholder email domains
 */
export function validateEmail(email) {
  if (!email || typeof email !== 'string' || !email.trim()) {
    return 'Email address is required.';
  }

  const trimmed = email.trim().toLowerCase();

  // Length check (RFC specifies max 254 characters)
  if (trimmed.length < 6 || trimmed.length > 254) {
    return 'Please enter a valid email address (6 to 254 characters).';
  }

  // Exactly one '@' symbol
  const atIndex = trimmed.indexOf('@');
  const lastAtIndex = trimmed.lastIndexOf('@');
  if (atIndex === -1 || atIndex !== lastAtIndex) {
    return 'Please enter a valid email address with a single @ symbol.';
  }

  const [localPart, domainPart] = trimmed.split('@');

  // 1. Local part (username) validation
  if (!localPart || localPart.length < 2 || localPart.length > 64) {
    return 'Email username must be between 2 and 64 characters.';
  }

  if (!/^[a-z0-9]/.test(localPart)) {
    return 'Email username must start with a letter or number.';
  }

  if (!/[a-z0-9]$/.test(localPart)) {
    return 'Email username must end with a letter or number.';
  }

  if (localPart.includes('..') || domainPart.includes('..')) {
    return 'Email address cannot contain consecutive dots.';
  }

  // Strictly allowed characters in local part
  if (!/^[a-z0-9]+([._%+-][a-z0-9]+)*$/.test(localPart)) {
    return 'Email username contains invalid special characters.';
  }

  // 2. Domain part validation
  if (!domainPart || domainPart.length < 4) {
    return 'Please enter a complete domain name (e.g. gmail.com, gov.in).';
  }

  const domainParts = domainPart.split('.');
  if (domainParts.length < 2) {
    return 'Email domain must include a valid extension (e.g. .com, .in, .org).';
  }

  // Validate each domain segment
  for (const part of domainParts) {
    if (!part || part.length < 2) {
      return 'Domain parts must be at least 2 characters long.';
    }
    if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/.test(part)) {
      return 'Domain contains invalid characters or formatting.';
    }
  }

  // Validate TLD (Top-Level Domain): strictly alphabetic, minimum 2 characters
  const tld = domainParts[domainParts.length - 1];
  if (!/^[a-z]{2,24}$/.test(tld)) {
    return 'Email extension must only contain letters (at least 2 letters, e.g. .com, .in).';
  }

  // Disallow common fake, temporary, or placeholder domains
  const bannedPlaceholderDomains = [
    'test.com',
    'fake.com',
    'example.com',
    'sample.com',
    'temp.com',
    'mailinator.com',
    'trashmail.com',
    '10minutemail.com',
    'asdf.com',
    'abc.com',
    'xyz.xyz',
    'invalid.com',
  ];

  if (bannedPlaceholderDomains.includes(domainPart)) {
    return 'Placeholder or disposable email domains are not allowed. Please enter a real email address.';
  }

  return null; // Valid real-world email
}

/**
 * Analyzes password complexity in real time
 * Returns strength level (weak, moderate, strong), UI colors, and constructive suggestions
 */
export function checkPasswordStrength(password) {
  if (!password) {
    return {
      level: 'none',
      label: '',
      color: '',
      textColor: 'text-slate-400',
      percent: 0,
      hints: [],
    };
  }

  let passedRules = 0;
  const missingHints = [];

  if (password.length >= 8) {
    passedRules += 1;
  } else {
    missingHints.push('8+ characters');
  }

  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) {
    passedRules += 1;
  } else {
    missingHints.push('uppercase & lowercase');
  }

  if (/[0-9]/.test(password)) {
    passedRules += 1;
  } else {
    missingHints.push('at least 1 number');
  }

  if (/[^A-Za-z0-9]/.test(password)) {
    passedRules += 1;
  } else {
    missingHints.push('at least 1 symbol');
  }

  if (password.length < 6 || passedRules <= 1) {
    return {
      level: 'weak',
      label: 'Weak',
      color: 'bg-red-500',
      textColor: 'text-red-600',
      borderColor: 'border-red-400',
      percent: 33,
      hints: missingHints,
    };
  }

  if (passedRules >= 2 && passedRules <= 3) {
    return {
      level: 'moderate',
      label: 'Moderate',
      color: 'bg-amber-500',
      textColor: 'text-amber-600',
      borderColor: 'border-amber-400',
      percent: 66,
      hints: missingHints,
    };
  }

  return {
    level: 'strong',
    label: 'Strong',
    color: 'bg-emerald-500',
    textColor: 'text-emerald-600',
    borderColor: 'border-emerald-400',
    percent: 100,
    hints: [],
  };
}
