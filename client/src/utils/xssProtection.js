// client/src/utils/xssProtection.js

// Sanitize input to prevent XSS
export const sanitizeInput = (input) => {
  if (!input || typeof input !== 'string') return input;
  return input
    .replace(/[&<>]/g, function(m) {
      if (m === '&') return '&amp;';
      if (m === '<') return '&lt;';
      if (m === '>') return '&gt;';
      return m;
    })
    .trim();
};

// Escape HTML for display
export const escapeHtml = (text) => {
  if (!text || typeof text !== 'string') return text;
  const htmlEscapes = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  };
  return text.replace(/[&<>"']/g, (char) => htmlEscapes[char]);
};

// Validate email format
export const isValidEmail = (email) => {
  if (!email || typeof email !== 'string') return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validate password strength
export const isStrongPassword = (password) => {
  if (!password || typeof password !== 'string') {
    return { isValid: false, errors: {} };
  }
  
  return {
    isValid: password.length >= 8 &&
      /[A-Z]/.test(password) &&
      /[a-z]/.test(password) &&
      /[0-9]/.test(password) &&
      /[!@#$%^&*(),.?":{}|<>]/.test(password),
    errors: {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    }
  };
};

// Sanitize filename
export const sanitizeFilename = (filename) => {
  if (!filename || typeof filename !== 'string') return filename;
  return filename.replace(/[^a-zA-Z0-9.\-_]/g, '_');
};