"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/hooks/use-toast";
import {
  Loader2,
  Users,
  Edit,
  Trash2,
  Plus,
  Search,
  RefreshCw,
  ArrowLeft,
  Save,
  X,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { getCustomers, updateCustomer, deleteCustomer } from "../actions";
import {
  validateEmail,
  validatePhone,
  validateCEP,
  validateName,
} from "@/lib/validations";
import Link from "next/link";

interface CustomerData {
  id: number;
  customerCode: string;
  fullName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  acquisitionSource: string;
  serviceType: string;
  isCompleted: boolean;
  observations: string;
  registrationDate: string;
}

interface EditingCustomer extends Partial<CustomerData> {
  id: number;
}

interface ViaCEPResponse {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  erro?: boolean;
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<CustomerData[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<CustomerData[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingCustomer, setEditingCustomer] =
    useState<EditingCustomer | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isLoadingCEP, setIsLoadingCEP] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<CustomerData | null>(
    null
  );
  const [validationErrors, setValidationErrors] = useState<{
    [key: string]: string;
  }>({});

  useEffect(() => {
    loadCustomers();
  }, []);

  useEffect(() => {
    // Filtrar clientes baseado no termo de busca
    if (searchTerm.trim() === "") {
      setFilteredCustomers(customers);
    } else {
      const filtered = customers.filter(
        (customer) =>
          customer.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          customer.customerCode
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          customer.phone.includes(searchTerm)
      );
      setFilteredCustomers(filtered);
    }
  }, [customers, searchTerm]);

  const loadCustomers = async () => {
    setIsLoading(true);
    try {
      const result = await getCustomers();
      if (result.success) {
        setCustomers(result.customers);
        toast({
          title: "✅ Dados Carregados",
          description: result.message,
        });
      } else {
        throw new Error(result.error || "Falha ao carregar clientes");
      }
    } catch (error) {
      toast({
        title: "❌ Erro ao Carregar",
        description:
          error instanceof Error ? error.message : "Falha ao carregar clientes",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const consultarCEP = async (cep: string) => {
    if (!cep || cep.length < 8 || !editingCustomer) return;

    setIsLoadingCEP(true);
    try {
      const cepLimpo = cep.replace(/\D/g, "");
      const response = await fetch(
        `https://viacep.com.br/ws/${cepLimpo}/json/`
      );
      const data: ViaCEPResponse = await response.json();

      if (data.erro) {
        toast({
          title: "❌ CEP não encontrado",
          description: "O CEP informado não foi encontrado na base de dados.",
          variant: "destructive",
        });
        return;
      }

      // Preencher automaticamente os campos
      setEditingCustomer((prev) =>
        prev
          ? {
              ...prev,
              address: data.logradouro || "",
              city: data.localidade || "",
              state: data.uf || "",
            }
          : null
      );

      toast({
        title: "✅ Endereço encontrado",
        description: `Endereço preenchido automaticamente para ${data.localidade}/${data.uf}`,
      });
    } catch (error) {
      toast({
        title: "❌ Erro ao consultar CEP",
        description: "Não foi possível consultar o CEP. Verifique sua conexão.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingCEP(false);
    }
  };

  const handleCEPChange = (value: string) => {
    if (!editingCustomer) return;

    // Formatação básica do CEP
    const formattedCEP = value
      .replace(/\D/g, "")
      .replace(/(\d{5})(\d{3})/, "$1-$2");

    setEditingCustomer((prev) =>
      prev
        ? {
            ...prev,
            zipCode: formattedCEP,
          }
        : null
    );

    // Consultar CEP quando tiver 8 dígitos
    if (formattedCEP.replace(/\D/g, "").length === 8) {
      consultarCEP(formattedCEP);
    }
  };

  const validateField = (field: string, value: string): string | null => {
    switch (field) {
      case "fullName":
        const nameValidation = validateName(value);
        return nameValidation.isValid ? null : nameValidation.message!;

      case "email":
        const emailValidation = validateEmail(value);
        return emailValidation.isValid ? null : emailValidation.message!;

      case "phone":
        const phoneValidation = validatePhone(value);
        return phoneValidation.isValid ? null : phoneValidation.message!;

      case "zipCode":
        const cepValidation = validateCEP(value);
        return cepValidation.isValid ? null : cepValidation.message!;

      default:
        return null;
    }
  };

  const handleEdit = (customer: CustomerData) => {
    setEditingCustomer({ ...customer });
    setValidationErrors({});
  };

  const handleCancelEdit = () => {
    setEditingCustomer(null);
    setValidationErrors({});
  };

  const handleFieldChange = (field: string, value: string | boolean) => {
    if (!editingCustomer) return;

    setEditingCustomer((prev) => ({
      ...prev!,
      [field]: value,
    }));

    // Validação em tempo real
    if (typeof value === "string") {
      const error = validateField(field, value);
      setValidationErrors((prev) => ({
        ...prev,
        [field]: error || "",
      }));
    }
  };

  const validateEditForm = (): boolean => {
    if (!editingCustomer) return false;

    const errors: { [key: string]: string } = {};
    let isValid = true;

    // Validar campos obrigatórios
    const nameError = validateField("fullName", editingCustomer.fullName || "");
    if (nameError) {
      errors.fullName = nameError;
      isValid = false;
    }

    const emailError = validateField("email", editingCustomer.email || "");
    if (emailError) {
      errors.email = emailError;
      isValid = false;
    }

    const phoneError = validateField("phone", editingCustomer.phone || "");
    if (phoneError) {
      errors.phone = phoneError;
      isValid = false;
    }

    const cepError = validateField("zipCode", editingCustomer.zipCode || "");
    if (cepError) {
      errors.zipCode = cepError;
      isValid = false;
    }

    setValidationErrors(errors);
    return isValid;
  };

  const handleSaveEdit = async () => {
    if (!editingCustomer || !validateEditForm()) {
      toast({
        title: "❌ Dados Inválidos",
        description: "Por favor, corrija os erros antes de salvar",
        variant: "destructive",
      });
      return;
    }

    setIsUpdating(true);
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
      });

      if (result.success) {
        toast({
          title: "✅ Cliente Atualizado",
          description: result.message,
        });
        setEditingCustomer(null);
        await loadCustomers(); // Recarregar dados
      } else {
        throw new Error(result.error || "Falha ao atualizar cliente");
      }
    } catch (error) {
      toast({
        title: "❌ Erro na Atualização",
        description:
          error instanceof Error ? error.message : "Falha ao atualizar cliente",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async (customer: CustomerData) => {
    setCustomerToDelete(customer);

    toast({
      title: "🗑️ Confirmar exclusão",
      description: `Tem certeza que deseja excluir o cliente "${customer.fullName}"?`,
      action: (
        <div className="flex gap-2 mt-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setCustomerToDelete(null);
              toast({
                title: "❌ Exclusão cancelada",
                description: "O cliente não foi excluído.",
              });
            }}
          >
            Cancelar
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={async () => {
              setCustomerToDelete(null);
              await performDelete(customer);
            }}
          >
            Confirmar
          </Button>
        </div>
      ),
      duration: 10000, // 10 segundos para dar tempo de decidir
    });
  };

  const performDelete = async (customer: CustomerData) => {
    try {
      toast({
        title: "🗑️ Excluindo...",
        description: `Removendo ${customer.fullName} do sistema...`,
      });

      const result = await deleteCustomer(customer.id);

      if (result.success) {
        toast({
          title: "✅ Cliente Excluído",
          description: result.message,
        });
        await loadCustomers(); // Recarregar dados
      } else {
        throw new Error(result.error || "Falha ao excluir cliente");
      }
    } catch (error) {
      toast({
        title: "❌ Erro na Exclusão",
        description:
          error instanceof Error ? error.message : "Falha ao excluir cliente",
        variant: "destructive",
      });
    }
  };

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
    );
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
              <p className="text-gray-600">
                {filteredCustomers.length} cliente(s) encontrado(s)
              </p>
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
                    {searchTerm
                      ? "Nenhum cliente encontrado"
                      : "Nenhum cliente cadastrado"}
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {searchTerm
                      ? "Tente ajustar os termos de busca"
                      : "Comece cadastrando seu primeiro cliente"}
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
              <Card
                key={customer.id}
                className={`shadow-sm transition-all duration-200 ${
                  editingCustomer?.id === customer.id
                    ? "border-2 border-blue-500 ring-2 ring-blue-200 bg-blue-50/60 scale-[1.01]"
                    : ""
                }`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        {customer.fullName}
                        {editingCustomer?.id === customer.id && (
                          <span className="ml-2 px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-700 font-semibold animate-pulse">
                            Editando
                          </span>
                        )}
                      </CardTitle>
                      <CardDescription>
                        Código: {customer.customerCode} • Cadastrado em:{" "}
                        {customer.registrationDate}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <div
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          customer.isCompleted
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {customer.isCompleted ? "Concluído" : "Pendente"}
                      </div>
                      {editingCustomer?.id !== customer.id && (
                        <>
                          <Button
                            onClick={() => handleEdit(customer)}
                            variant="outline"
                            size="sm"
                            className="hover:border-blue-500 group"
                            title="Editar cliente"
                          >
                            <Edit className="h-4 w-4 group-hover:text-blue-600 transition-colors" />
                          </Button>
                          <Button
                            onClick={() => handleDelete(customer)}
                            variant="outline"
                            size="sm"
                            className="text-red-600 hover:text-white hover:bg-red-600 border-red-200 hover:border-red-600 transition-colors"
                            title="Excluir cliente"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="pt-2 pb-4">
                  {editingCustomer?.id === customer.id ? (
                    // Modo de edição
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleSaveEdit();
                      }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-blue-700 font-semibold">
                          Editando cliente
                        </span>
                        <Button
                          type="button"
                          variant={
                            editingCustomer.isCompleted ? "default" : "outline"
                          }
                          size="sm"
                          className={`gap-1 px-2 py-1 rounded bg-green-600 hover:bg-green-700 text-white ${
                            editingCustomer.isCompleted
                              ? ""
                              : "border-green-600 text-green-700 bg-white hover:bg-green-50"
                          }`}
                          onClick={() =>
                            handleFieldChange(
                              "isCompleted",
                              !editingCustomer.isCompleted
                            )
                          }
                          title={
                            editingCustomer.isCompleted
                              ? "Desmarcar como concluído"
                              : "Marcar como concluído"
                          }
                        >
                          <CheckCircle className="h-4 w-4" />
                          {editingCustomer.isCompleted
                            ? "Concluído"
                            : "Marcar como concluído"}
                        </Button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                        <div className="space-y-1">
                          <Label>Nome *</Label>
                          <Input
                            autoFocus
                            value={editingCustomer.fullName || ""}
                            onChange={(e) =>
                              handleFieldChange("fullName", e.target.value)
                            }
                            className={`bg-gray-50 h-8 px-2 py-1 text-sm ${
                              validationErrors.fullName ? "border-red-500" : ""
                            }`}
                          />
                          {validationErrors.fullName && (
                            <p className="text-xs text-red-600 flex items-center gap-1">
                              <AlertCircle className="h-4 w-4" />
                              {validationErrors.fullName}
                            </p>
                          )}
                        </div>
                        <div className="space-y-1">
                          <Label>Email *</Label>
                          <Input
                            type="email"
                            value={editingCustomer.email || ""}
                            onChange={(e) =>
                              handleFieldChange("email", e.target.value)
                            }
                            className={`bg-gray-50 h-8 px-2 py-1 text-sm ${
                              validationErrors.email ? "border-red-500" : ""
                            }`}
                          />
                          {validationErrors.email && (
                            <p className="text-xs text-red-600 flex items-center gap-1">
                              <AlertCircle className="h-4 w-4" />
                              {validationErrors.email}
                            </p>
                          )}
                        </div>
                        <div className="space-y-1">
                          <Label>Telefone *</Label>
                          <Input
                            value={editingCustomer.phone || ""}
                            onChange={(e) =>
                              handleFieldChange("phone", e.target.value)
                            }
                            className={`bg-gray-50 h-8 px-2 py-1 text-sm ${
                              validationErrors.phone ? "border-red-500" : ""
                            }`}
                          />
                          {validationErrors.phone && (
                            <p className="text-xs text-red-600 flex items-center gap-1">
                              <AlertCircle className="h-4 w-4" />
                              {validationErrors.phone}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-1">
                        <div className="space-y-1">
                          <Label>Cidade</Label>
                          <Input
                            value={editingCustomer.city || ""}
                            onChange={(e) =>
                              handleFieldChange("city", e.target.value)
                            }
                            className="bg-gray-50 h-8 px-2 py-1 text-sm"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label>Estado</Label>
                          <Select
                            value={editingCustomer.state || ""}
                            onChange={(e) =>
                              handleFieldChange("state", e.target.value)
                            }
                            className="bg-gray-50 h-8 px-2 py-1 text-sm"
                          >
                            <option value="">UF</option>
                            <option value="SP">SP</option>
                          </Select>
                        </div>
                        <div className="space-y-1">
                          <Label>CEP</Label>
                          <div className="relative">
                            <Input
                              value={editingCustomer.zipCode || ""}
                              onChange={(e) => handleCEPChange(e.target.value)}
                              className={`bg-gray-50 h-8 px-2 py-1 text-sm ${
                                validationErrors.zipCode ? "border-red-500" : ""
                              }`}
                            />
                            {isLoadingCEP && (
                              <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                                <Loader2 className="h-3 w-3 animate-spin text-blue-600" />
                              </div>
                            )}
                          </div>
                          {validationErrors.zipCode && (
                            <p className="text-xs text-red-600 flex items-center gap-1">
                              <AlertCircle className="h-4 w-4" />
                              {validationErrors.zipCode}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-1">
                        <div className="space-y-1">
                          <Label>Endereço</Label>
                          <Input
                            value={editingCustomer.address || ""}
                            onChange={(e) =>
                              handleFieldChange("address", e.target.value)
                            }
                            className="bg-gray-50 h-8 px-2 py-1 text-sm"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label>Fonte</Label>
                          <Select
                            value={editingCustomer.acquisitionSource || ""}
                            onChange={(e) =>
                              handleFieldChange(
                                "acquisitionSource",
                                e.target.value
                              )
                            }
                            className="bg-gray-50 h-8 px-2 py-1 text-sm"
                          >
                            <option value="">Fonte</option>
                            <option value="App">App</option>
                            <option value="Site">Site</option>
                            <option value="Indicação">Indicação</option>
                            <option value="Redes Sociais">Redes Sociais</option>
                            <option value="Outros">Outros</option>
                          </Select>
                        </div>
                        <div className="space-y-1">
                          <Label>Serviço</Label>
                          <Select
                            value={editingCustomer.serviceType || ""}
                            onChange={(e) =>
                              handleFieldChange("serviceType", e.target.value)
                            }
                            className="bg-gray-50 h-8 px-2 py-1 text-sm"
                          >
                            <option value="">Serviço</option>
                            <option value="Consultoria">Consultoria</option>
                            <option value="Instalação">Instalação</option>
                            <option value="Manutenção">Manutenção</option>
                            <option value="Reparo">Reparo</option>
                            <option value="Outros">Outros</option>
                          </Select>
                        </div>
                      </div>
                      <div className="space-y-1 mt-1">
                        <Label>Observações</Label>
                        <Textarea
                          value={editingCustomer.observations || ""}
                          onChange={(e) =>
                            handleFieldChange("observations", e.target.value)
                          }
                          className="bg-gray-50 h-8 px-2 py-1 text-sm min-h-[36px]"
                        />
                      </div>
                      <div className="flex justify-end gap-2 pt-2">
                        <Button
                          onClick={handleCancelEdit}
                          variant="outline"
                          disabled={isUpdating}
                          title="Cancelar edição"
                          size="sm"
                        >
                          <X className="h-4 w-4 mr-2" />
                          Cancelar
                        </Button>
                        <Button
                          type="submit"
                          disabled={isUpdating}
                          className="bg-green-600 hover:bg-green-700 text-white"
                          title="Salvar alterações"
                          size="sm"
                        >
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
                    </form>
                  ) : (
                    // Modo de visualização
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-600">
                          Email:
                        </span>
                        <p>{customer.email}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-600">
                          Telefone:
                        </span>
                        <p>{customer.phone}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-600">
                          Cidade:
                        </span>
                        <p>{customer.city || "Não informado"}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-600">
                          Estado:
                        </span>
                        <p>
                          {customer.state?.toUpperCase() || "Não informado"}
                        </p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-600">
                          Fonte:
                        </span>
                        <p>{customer.acquisitionSource || "Não informado"}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-600">
                          Serviço:
                        </span>
                        <p>{customer.serviceType || "Não informado"}</p>
                      </div>
                      {customer.observations && (
                        <div className="md:col-span-2 lg:col-span-3">
                          <span className="font-medium text-gray-600">
                            Observações:
                          </span>
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
  );
}
