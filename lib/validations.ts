// Utilitários de validação
export interface ValidationResult {
  isValid: boolean
  message?: string
}

export const validateEmail = (email: string): ValidationResult => {
  if (!email) {
    return { isValid: false, message: "Email é obrigatório" }
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return { isValid: false, message: "Formato de email inválido" }
  }

  return { isValid: true }
}

export const validatePhone = (phone: string): ValidationResult => {
  if (!phone) {
    return { isValid: false, message: "Telefone é obrigatório" }
  }

  // Remove caracteres não numéricos
  const cleanPhone = phone.replace(/\D/g, "")

  if (cleanPhone.length < 10 || cleanPhone.length > 11) {
    return { isValid: false, message: "Telefone deve ter 10 ou 11 dígitos" }
  }

  return { isValid: true }
}

export const validateCEP = (cep: string): ValidationResult => {
  if (!cep) {
    return { isValid: true } // CEP é opcional
  }

  const cepRegex = /^\d{5}-?\d{3}$/
  if (!cepRegex.test(cep)) {
    return { isValid: false, message: "CEP deve ter o formato 12345-678" }
  }

  return { isValid: true }
}

export const validateName = (name: string): ValidationResult => {
  if (!name) {
    return { isValid: false, message: "Nome é obrigatório" }
  }

  if (name.length < 2) {
    return { isValid: false, message: "Nome deve ter pelo menos 2 caracteres" }
  }

  if (name.length > 100) {
    return { isValid: false, message: "Nome deve ter no máximo 100 caracteres" }
  }

  return { isValid: true }
}

export const formatPhone = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, "")

  if (cleaned.length === 11) {
    return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3")
  } else if (cleaned.length === 10) {
    return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3")
  }

  return phone
}

export const formatCEP = (cep: string): string => {
  const cleaned = cep.replace(/\D/g, "")
  if (cleaned.length === 8) {
    return cleaned.replace(/(\d{5})(\d{3})/, "$1-$2")
  }
  return cep
}
