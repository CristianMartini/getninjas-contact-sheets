"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "@/hooks/use-toast"
import { Loader2, Users, CheckCircle, TestTube, AlertCircle, Database } from "lucide-react"
import { registerCustomer, testConnection } from "./actions"
import { validateEmail, validatePhone, validateCEP, validateName, formatPhone, formatCEP } from "@/lib/validations"
import Link from "next/link"

interface CustomerData {
  fullName: string
  email: string
  phone: string
  address: string
  city: string
  state: string
  zipCode: string
  acquisitionSource: string
  serviceType: string
  isCompleted: boolean
  observations: string
}

interface ValidationErrors {
  [key: string]: string
}

export default function CustomerRegistration() {
  const [isLoading, setIsLoading] = useState(false)
  const [isTestingConnection, setIsTestingConnection] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<"unknown" | "connected" | "error">("unknown")
  const [customerCode, setCustomerCode] = useState("")
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({})
  const [formData, setFormData] = useState<CustomerData>({
    fullName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    acquisitionSource: "",
    serviceType: "",
    isCompleted: false,
    observations: "",
  })

  // Testar conexão automaticamente ao carregar a página
  useEffect(() => {
    handleTestConnection()
  }, [])

  const generateCustomerCode = () => {
    const timestamp = Date.now().toString().slice(-6)
    const random = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, "0")
    return `CUST${timestamp}${random}`
  }

  const validateField = (field: keyof CustomerData, value: string | boolean): string | null => {
    switch (field) {
      case "fullName":
        const nameValidation = validateName(value as string)
        return nameValidation.isValid ? null : nameValidation.message!

      case "email":
        const emailValidation = validateEmail(value as string)
        return emailValidation.isValid ? null : emailValidation.message!

      case "phone":
        const phoneValidation = validatePhone(value as string)
        return phoneValidation.isValid ? null : phoneValidation.message!

      case "zipCode":
        const cepValidation = validateCEP(value as string)
        return cepValidation.isValid ? null : cepValidation.message!

      default:
        return null
    }
  }

  const handleInputChange = (field: keyof CustomerData, value: string | boolean) => {
    let processedValue = value

    // Formatação automática
    if (field === "phone" && typeof value === "string") {
      processedValue = formatPhone(value)
    } else if (field === "zipCode" && typeof value === "string") {
      processedValue = formatCEP(value)
    }

    setFormData((prev) => ({
      ...prev,
      [field]: processedValue,
    }))

    // Validação em tempo real
    if (typeof processedValue === "string") {
      const error = validateField(field, processedValue)
      setValidationErrors((prev) => ({
        ...prev,
        [field]: error || "",
      }))
    }
  }

  const validateForm = (): boolean => {
    const errors: ValidationErrors = {}
    let isValid = true

    // Validar campos obrigatórios
    const nameError = validateField("fullName", formData.fullName)
    if (nameError) {
      errors.fullName = nameError
      isValid = false
    }

    const emailError = validateField("email", formData.email)
    if (emailError) {
      errors.email = emailError
      isValid = false
    }

    const phoneError = validateField("phone", formData.phone)
    if (phoneError) {
      errors.phone = phoneError
      isValid = false
    }

    const cepError = validateField("zipCode", formData.zipCode)
    if (cepError) {
      errors.zipCode = cepError
      isValid = false
    }

    setValidationErrors(errors)
    return isValid
  }

  const handleTestConnection = async () => {
    setIsTestingConnection(true)
    setConnectionStatus("unknown")

    try {
      const result = await testConnection()
      if (result.success) {
        setConnectionStatus("connected")
        toast({
          title: "✅ Conexão Estabelecida",
          description: result.message,
        })
      } else {
        setConnectionStatus("error")
        throw new Error(result.error || "Falha ao conectar com a planilha")
      }
    } catch (error) {
      setConnectionStatus("error")
      toast({
        title: "❌ Erro de Conexão",
        description: error instanceof Error ? error.message : "Falha ao conectar com o Google Sheets",
        variant: "destructive",
      })
    } finally {
      setIsTestingConnection(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Verificar conexão antes de enviar
    if (connectionStatus !== "connected") {
      toast({
        title: "⚠️ Conexão Necessária",
        description: "Teste a conexão com o Google Sheets antes de cadastrar",
        variant: "destructive",
      })
      return
    }

    // Validar formulário
    if (!validateForm()) {
      toast({
        title: "❌ Dados Inválidos",
        description: "Por favor, corrija os erros no formulário antes de continuar",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      const newCustomerCode = generateCustomerCode()
      setCustomerCode(newCustomerCode)

      toast({
        title: "📝 Processando...",
        description: "Cadastrando cliente no sistema...",
      })

      const result = await registerCustomer({
        customerCode: newCustomerCode,
        ...formData,
      })

      if (result.success) {
        toast({
          title: "🎉 Sucesso!",
          description: result.message,
        })

        // Limpar formulário
        setFormData({
          fullName: "",
          email: "",
          phone: "",
          address: "",
          city: "",
          state: "",
          zipCode: "",
          acquisitionSource: "",
          serviceType: "",
          isCompleted: false,
          observations: "",
        })
        setValidationErrors({})
      } else {
        throw new Error(result.error || "Falha ao registrar cliente")
      }
    } catch (error) {
      toast({
        title: "❌ Erro no Cadastro",
        description: error instanceof Error ? error.message : "Falha ao registrar cliente",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getConnectionStatusColor = () => {
    switch (connectionStatus) {
      case "connected":
        return "border-green-200 bg-green-50"
      case "error":
        return "border-red-200 bg-red-50"
      default:
        return "border-blue-200 bg-blue-50"
    }
  }

  const getConnectionStatusIcon = () => {
    switch (connectionStatus) {
      case "connected":
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case "error":
        return <AlertCircle className="h-5 w-5 text-red-600" />
      default:
        return <TestTube className="h-5 w-5 text-blue-600" />
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Users className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Sistema de Cadastro de Clientes</h1>
          </div>
          <p className="text-gray-600">Registre novos clientes e sincronize automaticamente com o Google Sheets</p>

          {/* Link para página de gerenciamento */}
          <div className="mt-4">
            <Link href="/customers">
              <Button variant="outline" className="gap-2 bg-transparent">
                <Database className="h-4 w-4" />
                Gerenciar Clientes
              </Button>
            </Link>
          </div>
        </div>

        {/* Status de Conexão */}
        <Card className={`mb-6 ${getConnectionStatusColor()}`}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {getConnectionStatusIcon()}
                <div>
                  <h3 className="font-medium">
                    {connectionStatus === "connected" && "Conectado ao Google Sheets"}
                    {connectionStatus === "error" && "Erro de Conexão"}
                    {connectionStatus === "unknown" && "Status de Conexão"}
                  </h3>
                  <p className="text-sm opacity-75">
                    {connectionStatus === "connected" && "Sistema pronto para cadastrar clientes"}
                    {connectionStatus === "error" && "Verifique as configurações e tente novamente"}
                    {connectionStatus === "unknown" && "Verificando conexão com a planilha..."}
                  </p>
                </div>
              </div>
              <Button onClick={handleTestConnection} disabled={isTestingConnection} variant="outline" size="sm">
                {isTestingConnection ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Testando...
                  </>
                ) : (
                  <>
                    <TestTube className="mr-2 h-4 w-4" />
                    Testar Conexão
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Cadastro de Novo Cliente
            </CardTitle>
            <CardDescription>
              Preencha os dados do cliente abaixo. Todos os campos marcados com * são obrigatórios.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Informações do Cliente */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Nome Completo *</Label>
                  <Input
                    id="fullName"
                    value={formData.fullName}
                    onChange={(e) => handleInputChange("fullName", e.target.value)}
                    placeholder="Digite o nome completo do cliente"
                    className={validationErrors.fullName ? "border-red-500" : ""}
                    required
                  />
                  {validationErrors.fullName && (
                    <p className="text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      {validationErrors.fullName}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    placeholder="cliente@exemplo.com"
                    className={validationErrors.email ? "border-red-500" : ""}
                    required
                  />
                  {validationErrors.email && (
                    <p className="text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      {validationErrors.email}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone *</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    placeholder="(11) 99999-9999"
                    className={validationErrors.phone ? "border-red-500" : ""}
                    required
                  />
                  {validationErrors.phone && (
                    <p className="text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      {validationErrors.phone}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="zipCode">CEP</Label>
                  <Input
                    id="zipCode"
                    value={formData.zipCode}
                    onChange={(e) => handleInputChange("zipCode", e.target.value)}
                    placeholder="12345-678"
                    className={validationErrors.zipCode ? "border-red-500" : ""}
                  />
                  {validationErrors.zipCode && (
                    <p className="text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      {validationErrors.zipCode}
                    </p>
                  )}
                </div>
              </div>

              {/* Informações de Endereço */}
              <div className="space-y-2">
                <Label htmlFor="address">Endereço</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleInputChange("address", e.target.value)}
                  placeholder="Rua, número, complemento"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="city">Cidade</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => handleInputChange("city", e.target.value)}
                    placeholder="Nome da cidade"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="state">Estado</Label>
                  <Select value={formData.state} onChange={(e) => handleInputChange("state", e.target.value)}>
                    <option value="">Selecione o estado</option>
                    <option value="ac">Acre</option>
                    <option value="al">Alagoas</option>
                    <option value="ap">Amapá</option>
                    <option value="am">Amazonas</option>
                    <option value="ba">Bahia</option>
                    <option value="ce">Ceará</option>
                    <option value="df">Distrito Federal</option>
                    <option value="es">Espírito Santo</option>
                    <option value="go">Goiás</option>
                    <option value="ma">Maranhão</option>
                    <option value="mt">Mato Grosso</option>
                    <option value="ms">Mato Grosso do Sul</option>
                    <option value="mg">Minas Gerais</option>
                    <option value="pa">Pará</option>
                    <option value="pb">Paraíba</option>
                    <option value="pr">Paraná</option>
                    <option value="pe">Pernambuco</option>
                    <option value="pi">Piauí</option>
                    <option value="rj">Rio de Janeiro</option>
                    <option value="rn">Rio Grande do Norte</option>
                    <option value="rs">Rio Grande do Sul</option>
                    <option value="ro">Rondônia</option>
                    <option value="rr">Roraima</option>
                    <option value="sc">Santa Catarina</option>
                    <option value="sp">São Paulo</option>
                    <option value="se">Sergipe</option>
                    <option value="to">Tocantins</option>
                  </Select>
                </div>
              </div>

              {/* Informações do Negócio */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="acquisitionSource">Como o cliente foi adquirido?</Label>
                  <Select
                    value={formData.acquisitionSource}
                    onChange={(e) => handleInputChange("acquisitionSource", e.target.value)}
                  >
                    <option value="">Selecione a fonte de aquisição</option>
                    <option value="App">Aplicativo Mobile</option>
                    <option value="Site">Site</option>
                    <option value="Indicação">Indicação</option>
                    <option value="Redes Sociais">Redes Sociais</option>
                    <option value="Publicidade">Publicidade</option>
                    <option value="Visita Presencial">Visita Presencial</option>
                    <option value="Ligação Telefônica">Ligação Telefônica</option>
                    <option value="WhatsApp">WhatsApp</option>
                    <option value="Outros">Outros</option>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="serviceType">Tipo de Serviço</Label>
                  <Select
                    value={formData.serviceType}
                    onChange={(e) => handleInputChange("serviceType", e.target.value)}
                  >
                    <option value="">Selecione o tipo de serviço</option>
                    <option value="Consultoria">Consultoria</option>
                    <option value="Instalação">Instalação</option>
                    <option value="Manutenção">Manutenção</option>
                    <option value="Reparo">Reparo</option>
                    <option value="Suporte Técnico">Suporte Técnico</option>
                    <option value="Treinamento">Treinamento</option>
                    <option value="Entrega">Entrega</option>
                    <option value="Outros">Outros</option>
                  </Select>
                </div>
              </div>

              {/* Status e Observações */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isCompleted"
                    checked={formData.isCompleted}
                    onCheckedChange={(checked) => handleInputChange("isCompleted", checked as boolean)}
                  />
                  <Label
                    htmlFor="isCompleted"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Serviço concluído
                  </Label>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="observations">Observações</Label>
                  <Textarea
                    id="observations"
                    value={formData.observations}
                    onChange={(e) => handleInputChange("observations", e.target.value)}
                    placeholder="Anotações adicionais ou observações..."
                    className="min-h-[80px]"
                  />
                </div>
              </div>

              {/* Botão de Envio */}
              <div className="flex justify-end pt-6">
                <Button
                  type="submit"
                  disabled={isLoading || connectionStatus !== "connected"}
                  className="min-w-[150px]"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Cadastrando...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Cadastrar Cliente
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {customerCode && (
          <Card className="mt-6 border-green-200 bg-green-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-green-800">
                <CheckCircle className="h-5 w-5" />
                <span className="font-medium">Cliente cadastrado com sucesso!</span>
              </div>
              <p className="text-green-700 mt-2">
                Código de Registro: <span className="font-mono font-bold">{customerCode}</span>
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
