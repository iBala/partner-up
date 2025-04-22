export const validateUrl = (url: string): { isValid: boolean; normalizedUrl: string } => {
  try {
    // If URL doesn't start with http:// or https://, add https://
    const normalizedUrl = url.trim().startsWith('http://') || url.trim().startsWith('https://') 
      ? url.trim() 
      : `https://${url.trim()}`
    
    // Create URL object to validate
    const urlObj = new URL(normalizedUrl)
    
    // Check if the hostname has a TLD (e.g., .com, .org, etc.)
    // This regex checks for at least one dot followed by 2 or more characters
    const hasTLD = /\.([a-zA-Z]{2,})$/.test(urlObj.hostname)
    
    if (!hasTLD) {
      return { isValid: false, normalizedUrl }
    }
    
    return { isValid: true, normalizedUrl }
  } catch {
    return { isValid: false, normalizedUrl: url.trim() }
  }
}

export const validatePhoneNumber = (phone: string): boolean => {
  // Only allow '+' at the start and numbers
  return /^\+?[0-9]+$/.test(phone)
}

export const sanitizeText = (text: string): string => {
  // Remove HTML tags and special characters
  return text
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/[<>]/g, '') // Remove < and > characters
    .trim()
}

export const validateName = (name: string): boolean => {
  // Allow letters, spaces, hyphens, and apostrophes
  return /^[a-zA-Z\s\-']+$/.test(name)
} 