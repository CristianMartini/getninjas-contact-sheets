"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "@/hooks/use-toast"
import { Loader2, Users, CheckCircle, TestTube } from "lucide-react"
import { registerCustomer, testConnection } from "./actions"

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

export default function CustomerRegistration() {
  const [isLoading, setIsLoading] = useState(false)
  const [isTestingConnection, setIsTestingConnection] = useState(false)
  const [customerCode, setCustomerCode] = useState("")
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

  const generateCustomerCode = () => {
    const timestamp = Date.now().toString().slice(-6)
    const random = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, "0")
    return `CUST${timestamp}${random}`
  }

  const handleInputChange = (field: keyof CustomerData, value: string | boolean) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleTestConnection = async () => {
    setIsTestingConnection(true)
    try {
      const result = await testConnection()
      if (result.success) {
        toast({
          title: "Conexão bem-sucedida!",
          description: `Conectado à planilha: ${result.sheetTitle}`,
        })
      } else {
        throw new Error(result.error || "Falha ao conectar com a planilha")
      }
    } catch (error) {
      toast({
        title: "Erro de Conexão",
        description: error instanceof Error ? error.message : "Falha ao conectar com o Google Sheets",
        variant: "destructive",
      })
    } finally {
      setIsTestingConnection(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.fullName || !formData.email || !formData.phone) {
      toast({
        title: "Erro de Validação",
        description: "Por favor, preencha todos os campos obrigatórios (Nome, Email, Telefone)",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      const newCustomerCode = generateCustomerCode()
      setCustomerCode(newCustomerCode)

      const result = await registerCustomer({
        customerCode: newCustomerCode,
        ...formData,
      })

      if (result.success) {
        toast({
          title: "Sucesso!",
          description: `Cliente registrado com sucesso! Código: ${newCustomerCode}`,
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
      } else {
        throw new Error(result.error || "Falha ao registrar cliente")
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Falha ao registrar cliente",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
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
        </div>

        {/* Botão de Teste de Conexão */}
        <Card className="mb-6 border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-blue-900">Teste de Conexão com Google Sheets</h3>
                <p className="text-sm text-blue-700">Verifique se a conexão com a planilha está funcionando</p>
              </div>
              <Button
                onClick={handleTestConnection}
                disabled={isTestingConnection}
                variant="outline"
                className="border-blue-300 text-blue-700 hover:bg-blue-100 bg-transparent"
              >
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
              Preencha os dados do cliente abaixo. Um código de registro único será gerado automaticamente.
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
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    placeholder="cliente@exemplo.com"
                    required
                  />
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
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="zipCode">CEP</Label>
                  <Input
                    id="zipCode"
                    value={formData.zipCode}
                    onChange={(e) => handleInputChange("zipCode", e.target.value)}
                    placeholder="12345-678"
                  />
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
                  <Select value={formData.state} onValueChange={(value) => handleInputChange("state", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ac">Acre</SelectItem>
                      <SelectItem value="al">Alagoas</SelectItem>
                      <SelectItem value="ap">Amapá</SelectItem>
                      <SelectItem value="am">Amazonas</SelectItem>
                      <SelectItem value="ba">Bahia</SelectItem>
                      <SelectItem value="ce">Ceará</SelectItem>
                      <SelectItem value="df">Distrito Federal</SelectItem>
                      <SelectItem value="es">Espírito Santo</SelectItem>
                      <SelectItem value="go">Goiás</SelectItem>
                      <SelectItem value="ma">Maranhão</SelectItem>
                      <SelectItem value="mt">Mato Grosso</SelectItem>
                      <SelectItem value="ms">Mato Grosso do Sul</SelectItem>
                      <SelectItem value="mg">Minas Gerais</SelectItem>
                      <SelectItem value="pa">Pará</SelectItem>
                      <SelectItem value="pb">Paraíba</SelectItem>
                      <SelectItem value="pr">Paraná</SelectItem>
                      <SelectItem value="pe">Pernambuco</SelectItem>
                      <SelectItem value="pi">Piauí</SelectItem>
                      <SelectItem value="rj">Rio de Janeiro</SelectItem>
                      <SelectItem value="rn">Rio Grande do Norte</SelectItem>
                      <SelectItem value="rs">Rio Grande do Sul</SelectItem>
                      <SelectItem value="ro">Rondônia</SelectItem>
                      <SelectItem value="rr">Roraima</SelectItem>
                      <SelectItem value="sc">Santa Catarina</SelectItem>
                      <SelectItem value="sp">São Paulo</SelectItem>
                      <SelectItem value="se">Sergipe</SelectItem>
                      <SelectItem value="to">Tocantins</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Informações do Negócio */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="acquisitionSource">Como o cliente foi adquirido?</Label>
                  <Select
                    value={formData.acquisitionSource}
                    onValueChange={(value) => handleInputChange("acquisitionSource", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a fonte de aquisição" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="app">Aplicativo Mobile</SelectItem>
                      <SelectItem value="website">Site</SelectItem>
                      <SelectItem value="referral">Indicação</SelectItem>
                      <SelectItem value="social-media">Redes Sociais</SelectItem>
                      <SelectItem value="advertising">Publicidade</SelectItem>
                      <SelectItem value="walk-in">Visita Presencial</SelectItem>
                      <SelectItem value="phone">Ligação Telefônica</SelectItem>
                      <SelectItem value="whatsapp">WhatsApp</SelectItem>
                      <SelectItem value="other">Outros</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="serviceType">Tipo de Serviço</Label>
                  <Select
                    value={formData.serviceType}
                    onValueChange={(value) => handleInputChange("serviceType", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo de serviço" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="consultation">Consultoria</SelectItem>
                      <SelectItem value="installation">Instalação</SelectItem>
                      <SelectItem value="maintenance">Manutenção</SelectItem>
                      <SelectItem value="repair">Reparo</SelectItem>
                      <SelectItem value="support">Suporte Técnico</SelectItem>
                      <SelectItem value="training">Treinamento</SelectItem>
                      <SelectItem value="delivery">Entrega</SelectItem>
                      <SelectItem value="other">Outros</SelectItem>
                    </SelectContent>
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
                <Button type="submit" disabled={isLoading} className="min-w-[150px]">
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
