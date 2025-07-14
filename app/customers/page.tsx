"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "@/hooks/use-toast"
import { Loader2, Users, Edit, Trash2, Plus, Search, RefreshCw, ArrowLeft, Save, X, AlertCircle } from "lucide-react"
import { getCustomers, updateCustomer, deleteCustomer } from "../actions"
import { validateEmail, validatePhone, validateCEP, validateName } from "@/lib/validations"
import Link from "next/link"

interface CustomerData {
  id: number
  customerCode: string
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
  registrationDate: string
}

interface EditingCustomer extends Partial<CustomerData> {
  id: number
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<CustomerData[]>([])
  const [filteredCustomers, setFilteredCustomers] = useState<CustomerData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [editingCustomer, setEditingCustomer] = useState<EditingCustomer | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)
  const [validationErrors, setValidationErrors] = useState<{ [key: string]: string }>({})

  useEffect(() => {
    loadCustomers()
  }, [])

  useEffect(() => {
    // Filtrar clientes baseado no termo de busca
    if (searchTerm.trim() === "") {
      setFilteredCustomers(customers)
    } else {
      const filtered = customers.filter(
        (customer) =>
          customer.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          customer.customerCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
          customer.phone.includes(searchTerm),
      )
      setFilteredCustomers(filtered)
    }
  }, [customers, searchTerm])

  const loadCustomers = async () => {
    setIsLoading(true)
    try {
      const result = await getCustomers()
      if (result.success) {
        setCustomers(result.customers)
        toast({
          title: "✅ Dados Carregados",
          description: result.message,
        })
      } else {
        throw new Error(result.error || "Falha ao carregar clientes")
      }
    } catch (error) {
      toast({
        title: "❌ Erro ao Carregar",
        description: error instanceof Error ? error.message : "Falha ao carregar clientes",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const validateField = (field: string, value: string): string | null => {
    switch (field) {
      case "fullName":
        const nameValidation = validateName(value)
        return nameValidation.isValid ? null : nameValidation.message!

      case "email":
        const emailValidation = validateEmail(value)
        return emailValidation.isValid ? null : emailValidation.message!

      case "phone":
        const phoneValidation = validatePhone(value)
        return phoneValidation.isValid ? null : phoneValidation.message!

      case "zipCode":
        const cepValidation = validateCEP(value)
        return cepValidation.isValid ? null : cepValidation.message!

      default:
        return null
    }
  }

  const handleEdit = (customer: CustomerData) => {
    setEditingCustomer({ ...customer })
    setValidationErrors({})
  }

  const handleCancelEdit = () => {
    setEditingCustomer(null)
    setValidationErrors({})
  }

  const handleFieldChange = (field: string, value: string | boolean) => {
    if (!editingCustomer) return

    setEditingCustomer((prev) => ({
      ...prev!,
      [field]: value,
    }))

    // Validação em tempo real
    if (typeof value === "string") {
      const error = validateField(field, value)
      setValidationErrors((prev) => ({
        ...prev,
        [field]: error || "",
      }))
    }
  }

  const validateEditForm = (): boolean => {
    if (!editingCustomer) return false

    const errors: { [key: string]: string } = {}
    let isValid = true

    // Validar campos obrigatórios
    const nameError = validateField("fullName", editingCustomer.fullName || "")
    if (nameError) {
      errors.fullName = nameError
      isValid = false
    }

    const emailError = validateField("email", editingCustomer.email || "")
    if (emailError) {
      errors.email = emailError
      isValid = false
    }

    const phoneError = validateField("phone", editingCustomer.phone || "")
    if (phoneError) {
      errors.phone = phoneError
      isValid = false
    }

    const cepError = validateField("zipCode", editingCustomer.zipCode || "")
    if (cepError) {
      errors.zipCode = cepError
      isValid = false
    }

    setValidationErrors(errors)
    return isValid
  }

  const handleSaveEdit = async () => {
    if (!editingCustomer || !validateEditForm()) {
      toast({
        title: "❌ Dados Inválidos",
        description: "Por favor, corrija os erros antes de salvar",
        variant: "destructive",
      })
      return
    }

    setIsUpdating(true)
    try {
      const result = await updateCustomer(editingCustomer.id, {
        fullName: editingCustomer.fullName,
        email: editingCustomer.email,
        phone: editingCustomer.phone,
        address: editingCustomer.address,
        city: editingCustomer.city,
        state: editingCustomer.state,
        zipCode: editingCustomer.zipCode,
        acquisitionSource: editingCustomer.acquisitionSource,
        serviceType: editingCustomer.serviceType,
        isCompleted: editingCustomer.isCompleted,
        observations: editingCustomer.observations,
      })

      if (result.success) {
        toast({
          title: "✅ Cliente Atualizado",
          description: result.message,
        })
        setEditingCustomer(null)
        await loadCustomers() // Recarregar dados
      } else {
        throw new Error(result.error || "Falha ao atualizar cliente")
      }
    } catch (error) {
      toast({
        title: "❌ Erro na Atualização",
        description: error instanceof Error ? error.message : "Falha ao atualizar cliente",
        variant: "destructive",
      })
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDelete = async (customer: CustomerData) => {
    if (!confirm(`Tem certeza que deseja excluir o cliente ${customer.fullName}?`)) {
      return
    }

    try {
      toast({
        title: "🗑️ Excluindo...",
        description: `Removendo ${customer.fullName} do sistema...`,
      })

      const result = await deleteCustomer(customer.id)

      if (result.success) {
        toast({
          title: "✅ Cliente Excluído",
          description: result.message,
        })
        await loadCustomers() // Recarregar dados
      } else {
        throw new Error(result.error || "Falha ao excluir cliente")
      }
    } catch (error) {
      toast({
        title: "❌ Erro na Exclusão",
        description: error instanceof Error ? error.message : "Falha ao excluir cliente",
        variant: "destructive",
      })
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="pt-6">
            <div className="flex items-center justify-center gap-3">
              <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
              <span className="text-lg">Carregando clientes...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                <Users className="h-8 w-8 text-blue-600" />
                Gerenciar Clientes
              </h1>
              <p className="text-gray-600">{filteredCustomers.length} cliente(s) encontrado(s)</p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={loadCustomers} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Atualizar
            </Button>
            <Link href="/">
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Novo Cliente
              </Button>
            </Link>
          </div>
        </div>

        {/* Search */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Search className="h-5 w-5 text-gray-400" />
              <Input
                placeholder="Buscar por nome, email, código ou telefone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1"
              />
            </div>
          </CardContent>
        </Card>

        {/* Customer List */}
        <div className="space-y-4">
          {filteredCustomers.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {searchTerm ? "Nenhum cliente encontrado" : "Nenhum cliente cadastrado"}
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {searchTerm ? "Tente ajustar os termos de busca" : "Comece cadastrando seu primeiro cliente"}
                  </p>
                  {!searchTerm && (
                    <Link href="/">
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Cadastrar Cliente
                      </Button>
                    </Link>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            filteredCustomers.map((customer) => (
              <Card key={customer.id} className="shadow-sm">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{customer.fullName}</CardTitle>
                      <CardDescription>
                        Código: {customer.customerCode} • Cadastrado em: {customer.registrationDate}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <div
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          customer.isCompleted ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {customer.isCompleted ? "Concluído" : "Pendente"}
                      </div>
                      {editingCustomer?.id !== customer.id && (
                        <>
                          <Button onClick={() => handleEdit(customer)} variant="outline" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            onClick={() => handleDelete(customer)}
                            variant="outline"
                            size="sm"
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardHeader>

                <CardContent>
                  {editingCustomer?.id === customer.id ? (
                    // Modo de edição
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Nome Completo *</Label>
                          <Input
                            value={editingCustomer.fullName || ""}
                            onChange={(e) => handleFieldChange("fullName", e.target.value)}
                            className={validationErrors.fullName ? "border-red-500" : ""}
                          />
                          {validationErrors.fullName && (
                            <p className="text-sm text-red-600 flex items-center gap-1">
                              <AlertCircle className="h-4 w-4" />
                              {validationErrors.fullName}
                            </p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label>Email *</Label>
                          <Input
                            type="email"
                            value={editingCustomer.email || ""}
                            onChange={(e) => handleFieldChange("email", e.target.value)}
                            className={validationErrors.email ? "border-red-500" : ""}
                          />
                          {validationErrors.email && (
                            <p className="text-sm text-red-600 flex items-center gap-1">
                              <AlertCircle className="h-4 w-4" />
                              {validationErrors.email}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Telefone *</Label>
                          <Input
                            value={editingCustomer.phone || ""}
                            onChange={(e) => handleFieldChange("phone", e.target.value)}
                            className={validationErrors.phone ? "border-red-500" : ""}
                          />
                          {validationErrors.phone && (
                            <p className="text-sm text-red-600 flex items-center gap-1">
                              <AlertCircle className="h-4 w-4" />
                              {validationErrors.phone}
                            </p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label>CEP</Label>
                          <Input
                            value={editingCustomer.zipCode || ""}
                            onChange={(e) => handleFieldChange("zipCode", e.target.value)}
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

                      <div className="space-y-2">
                        <Label>Endereço</Label>
                        <Input
                          value={editingCustomer.address || ""}
                          onChange={(e) => handleFieldChange("address", e.target.value)}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Cidade</Label>
                          <Input
                            value={editingCustomer.city || ""}
                            onChange={(e) => handleFieldChange("city", e.target.value)}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Estado</Label>
                          <Select
                            value={editingCustomer.state || ""}
                            onChange={(e) => handleFieldChange("state", e.target.value)}
                          >
                            <option value="">Selecione o estado</option>
                            <option value="sp">São Paulo</option>
                            <option value="rj">Rio de Janeiro</option>
                            <option value="mg">Minas Gerais</option>
                            {/* Adicione outros estados conforme necessário */}
                          </Select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Fonte de Aquisição</Label>
                          <Select
                            value={editingCustomer.acquisitionSource || ""}
                            onChange={(e) => handleFieldChange("acquisitionSource", e.target.value)}
                          >
                            <option value="">Selecione</option>
                            <option value="app">Aplicativo Mobile</option>
                            <option value="website">Site</option>
                            <option value="referral">Indicação</option>
                            <option value="social-media">Redes Sociais</option>
                            <option value="other">Outros</option>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>Tipo de Serviço</Label>
                          <Select
                            value={editingCustomer.serviceType || ""}
                            onChange={(e) => handleFieldChange("serviceType", e.target.value)}
                          >
                            <option value="">Selecione</option>
                            <option value="consultation">Consultoria</option>
                            <option value="installation">Instalação</option>
                            <option value="maintenance">Manutenção</option>
                            <option value="repair">Reparo</option>
                            <option value="other">Outros</option>
                          </Select>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={`completed-${customer.id}`}
                          checked={editingCustomer.isCompleted || false}
                          onCheckedChange={(checked) => handleFieldChange("isCompleted", checked as boolean)}
                        />
                        <Label htmlFor={`completed-${customer.id}`}>Serviço concluído</Label>
                      </div>

                      <div className="space-y-2">
                        <Label>Observações</Label>
                        <Textarea
                          value={editingCustomer.observations || ""}
                          onChange={(e) => handleFieldChange("observations", e.target.value)}
                          className="min-h-[80px]"
                        />
                      </div>

                      <div className="flex justify-end gap-2 pt-4">
                        <Button onClick={handleCancelEdit} variant="outline" disabled={isUpdating}>
                          <X className="h-4 w-4 mr-2" />
                          Cancelar
                        </Button>
                        <Button onClick={handleSaveEdit} disabled={isUpdating}>
                          {isUpdating ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Salvando...
                            </>
                          ) : (
                            <>
                              <Save className="h-4 w-4 mr-2" />
                              Salvar
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    // Modo de visualização
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-600">Email:</span>
                        <p>{customer.email}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-600">Telefone:</span>
                        <p>{customer.phone}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-600">Cidade:</span>
                        <p>{customer.city || "Não informado"}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-600">Estado:</span>
                        <p>{customer.state?.toUpperCase() || "Não informado"}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-600">Fonte:</span>
                        <p>{customer.acquisitionSource || "Não informado"}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-600">Serviço:</span>
                        <p>{customer.serviceType || "Não informado"}</p>
                      </div>
                      {customer.observations && (
                        <div className="md:col-span-2 lg:col-span-3">
                          <span className="font-medium text-gray-600">Observações:</span>
                          <p className="mt-1">{customer.observations}</p>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
