"use server"

import { GoogleSpreadsheet } from "google-spreadsheet"
import { JWT } from "google-auth-library"

interface CustomerRegistrationData {
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
}

// Função para testar a conexão com o Google Sheets
export async function testConnection() {
  try {
    console.log("Iniciando teste de conexão...")

    // Verificar se as variáveis de ambiente estão definidas
    if (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL) {
      throw new Error("GOOGLE_SERVICE_ACCOUNT_EMAIL não está definido")
    }

    if (!process.env.GOOGLE_PRIVATE_KEY) {
      throw new Error("GOOGLE_PRIVATE_KEY não está definido")
    }

    if (!process.env.GOOGLE_SHEET_ID) {
      throw new Error("GOOGLE_SHEET_ID não está definido")
    }

    // Inicializar autenticação do Google Sheets
    const serviceAccountAuth = new JWT({
      email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    })

    console.log("Autenticação configurada, conectando à planilha...")

    // Inicializar o Google Spreadsheet
    const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID!, serviceAccountAuth)
    await doc.loadInfo()

    console.log("Conexão bem-sucedida! Título da planilha:", doc.title)

    return {
      success: true,
      sheetTitle: doc.title,
      sheetCount: doc.sheetCount,
    }
  } catch (error) {
    console.error("Erro no teste de conexão:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro desconhecido ao conectar",
    }
  }
}

export async function registerCustomer(data: CustomerRegistrationData) {
  try {
    console.log("Iniciando cadastro do cliente:", data.customerCode)

    // Inicializar autenticação do Google Sheets
    const serviceAccountAuth = new JWT({
      email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    })

    // Inicializar o Google Spreadsheet
    const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID!, serviceAccountAuth)
    await doc.loadInfo()

    console.log("Conectado à planilha:", doc.title)

    // Obter a primeira aba (ou criar uma se não existir)
    let sheet = doc.sheetsByIndex[0]

    if (!sheet) {
      console.log("Criando nova aba...")
      sheet = await doc.addSheet({
        title: "Cadastro de Clientes",
        headerValues: [
          "Código do cliente",
          "Empresa",
          "Nome",
          "Telefone",
          "Email",
          "Endereço",
          "Cidade",
          "Estado",
          "CEP",
          "Fonte de Aquisição",
          "Tipo de Serviço",
          "Realizado",
          "Observações",
          "Data de Registro",
        ],
      })
    }

    // Verificar se os cabeçalhos existem
    await sheet.loadHeaderRow()
    console.log("Cabeçalhos da planilha:", sheet.headerValues)

    // Adicionar os dados do novo cliente
    const newRow = await sheet.addRow({
      "Código do cliente": data.customerCode,
      Empresa: "", // Campo empresa vazio por enquanto
      Nome: data.fullName,
      Telefone: data.phone,
      Email: data.email,
      Endereço: data.address,
      Cidade: data.city,
      Estado: data.state,
      CEP: data.zipCode,
      "Fonte de Aquisição": data.acquisitionSource,
      "Tipo de Serviço": data.serviceType,
      Realizado: data.isCompleted ? "S" : "N",
      Observações: data.observations,
      "Data de Registro": new Date().toLocaleDateString("pt-BR"),
    })

    console.log("Cliente cadastrado com sucesso! Linha:", newRow.rowNumber)

    return { success: true, rowNumber: newRow.rowNumber }
  } catch (error) {
    console.error("Erro ao cadastrar cliente:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro desconhecido ao cadastrar cliente",
    }
  }
}
