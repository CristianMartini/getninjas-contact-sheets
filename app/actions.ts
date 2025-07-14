"use server";

import { GoogleSpreadsheet } from "google-spreadsheet";
import { JWT } from "google-auth-library";
import { formatPhone } from "@/lib/validations";

interface CustomerRegistrationData {
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
}

interface CustomerData extends CustomerRegistrationData {
  id: number;
  registrationDate: string;
}

// Função para testar a conexão com o Google Sheets
export async function testConnection() {
  try {
    console.log("🔍 Iniciando teste de conexão...");

    // Verificar se as variáveis de ambiente estão definidas
    if (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL) {
      throw new Error("GOOGLE_SERVICE_ACCOUNT_EMAIL não está definido");
    }

    if (!process.env.GOOGLE_PRIVATE_KEY) {
      throw new Error("GOOGLE_PRIVATE_KEY não está definido");
    }

    if (!process.env.GOOGLE_SHEET_ID) {
      throw new Error("GOOGLE_SHEET_ID não está definido");
    }

    // Inicializar autenticação do Google Sheets
    const serviceAccountAuth = new JWT({
      email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    console.log("🔐 Autenticação configurada, conectando à planilha...");

    // Inicializar o Google Spreadsheet
    const doc = new GoogleSpreadsheet(
      process.env.GOOGLE_SHEET_ID!,
      serviceAccountAuth
    );
    await doc.loadInfo();

    console.log("✅ Conexão bem-sucedida! Título da planilha:", doc.title);

    // Verificar se existe pelo menos uma aba
    if (doc.sheetCount === 0) {
      throw new Error("A planilha não possui nenhuma aba");
    }

    return {
      success: true,
      sheetTitle: doc.title,
      sheetCount: doc.sheetCount,
      message: `Conectado com sucesso à planilha "${doc.title}" com ${doc.sheetCount} aba(s)`,
    };
  } catch (error) {
    console.error("❌ Erro no teste de conexão:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Erro desconhecido ao conectar",
      message: "Falha na conexão com o Google Sheets",
    };
  }
}

// Função para obter ou criar a aba de clientes
async function getOrCreateCustomerSheet(doc: GoogleSpreadsheet) {
  let sheet = doc.sheetsByTitle["Cadastro de Clientes"] || doc.sheetsByIndex[0];

  if (!sheet) {
    console.log("📋 Criando nova aba...");
    sheet = await doc.addSheet({
      title: "Cadastro de Clientes",
      headerValues: [
        "ID",
        "Código do cliente",
        "Nome",
        "Email",
        "Telefone",
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
    });
  } else {
    await sheet.loadHeaderRow();

    // Verificar se os cabeçalhos estão corretos
    const expectedHeaders = [
      "ID",
      "Código do cliente",
      "Nome",
      "Email",
      "Telefone",
      "Endereço",
      "Cidade",
      "Estado",
      "CEP",
      "Fonte de Aquisição",
      "Tipo de Serviço",
      "Realizado",
      "Observações",
      "Data de Registro",
    ];

    if (sheet.headerValues.length === 0) {
      await sheet.setHeaderRow(expectedHeaders);
    }
  }

  return sheet;
}

export async function registerCustomer(data: CustomerRegistrationData) {
  try {
    console.log("📝 Iniciando cadastro do cliente:", data.customerCode);

    // Inicializar autenticação do Google Sheets
    const serviceAccountAuth = new JWT({
      email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    // Inicializar o Google Spreadsheet
    const doc = new GoogleSpreadsheet(
      process.env.GOOGLE_SHEET_ID!,
      serviceAccountAuth
    );
    await doc.loadInfo();

    console.log("📊 Conectado à planilha:", doc.title);

    // Obter ou criar a aba de clientes
    const sheet = await getOrCreateCustomerSheet(doc);

    // Carregar todas as linhas para obter o próximo ID
    const rows = await sheet.getRows();
    const nextId = rows.length + 1;

    // Adicionar os dados do novo cliente
    const newRow = await sheet.addRow({
      ID: nextId,
      "Código do cliente": data.customerCode,
      Nome: data.fullName,
      Email: data.email,
      Telefone: formatPhone(data.phone),
      Endereço: data.address,
      Cidade: data.city,
      Estado: data.state,
      CEP: data.zipCode,
      "Fonte de Aquisição": data.acquisitionSource,
      "Tipo de Serviço": data.serviceType,
      Realizado: data.isCompleted ? "S" : "N",
      Observações: data.observations,
      "Data de Registro": new Date().toLocaleDateString("pt-BR"),
    });

    console.log("✅ Cliente cadastrado com sucesso! Linha:", newRow.rowNumber);

    return {
      success: true,
      rowNumber: newRow.rowNumber,
      message: `Cliente ${data.fullName} cadastrado com sucesso!`,
      customerId: nextId,
    };
  } catch (error) {
    console.error("❌ Erro ao cadastrar cliente:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Erro desconhecido ao cadastrar cliente",
      message:
        "Falha ao cadastrar cliente. Verifique a conexão e tente novamente.",
    };
  }
}

export async function getCustomers() {
  try {
    console.log("📋 Buscando lista de clientes...");

    const serviceAccountAuth = new JWT({
      email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const doc = new GoogleSpreadsheet(
      process.env.GOOGLE_SHEET_ID!,
      serviceAccountAuth
    );
    await doc.loadInfo();

    const sheet = await getOrCreateCustomerSheet(doc);
    const rows = await sheet.getRows();

    const customers: CustomerData[] = rows.map((row, index) => ({
      id: Number.parseInt(row.get("ID")) || index + 1,
      customerCode: row.get("Código do cliente") || "",
      fullName: row.get("Nome") || "",
      email: row.get("Email") || "",
      phone: row.get("Telefone") || "", // Certifique-se de que está correto
      address: row.get("Endereço") || "",
      city: row.get("Cidade") || "",
      state: row.get("Estado") || "",
      zipCode: row.get("CEP") || "",
      acquisitionSource: row.get("Fonte de Aquisição") || "",
      serviceType: row.get("Tipo de Serviço") || "",
      isCompleted: row.get("Realizado") === "S",
      observations: row.get("Observações") || "",
      registrationDate: row.get("Data de Registro") || "",
    }));

    console.log(`✅ ${customers.length} clientes encontrados`);

    return {
      success: true,
      customers,
      message: `${customers.length} cliente(s) encontrado(s)`,
    };
  } catch (error) {
    console.error("❌ Erro ao buscar clientes:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro desconhecido",
      message: "Falha ao carregar lista de clientes",
      customers: [],
    };
  }
}

export async function updateCustomer(
  id: number,
  data: Partial<CustomerRegistrationData>
) {
  try {
    console.log("✏️ Atualizando cliente ID:", id);

    const serviceAccountAuth = new JWT({
      email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const doc = new GoogleSpreadsheet(
      process.env.GOOGLE_SHEET_ID!,
      serviceAccountAuth
    );
    await doc.loadInfo();

    const sheet = await getOrCreateCustomerSheet(doc);
    const rows = await sheet.getRows();

    const rowToUpdate = rows.find(
      (row) => Number.parseInt(row.get("ID")) === id
    );

    if (!rowToUpdate) {
      throw new Error("Cliente não encontrado");
    }

    // Atualizar apenas os campos fornecidos
    if (data.fullName !== undefined) rowToUpdate.set("Nome", data.fullName);
    if (data.email !== undefined) rowToUpdate.set("Email", data.email);
    if (data.phone !== undefined)
      rowToUpdate.set("Telefone", formatPhone(data.phone));
    if (data.address !== undefined) rowToUpdate.set("Endereço", data.address);
    if (data.city !== undefined) rowToUpdate.set("Cidade", data.city);
    if (data.state !== undefined) rowToUpdate.set("Estado", data.state);
    if (data.zipCode !== undefined) rowToUpdate.set("CEP", data.zipCode);
    if (data.acquisitionSource !== undefined)
      rowToUpdate.set("Fonte de Aquisição", data.acquisitionSource);
    if (data.serviceType !== undefined)
      rowToUpdate.set("Tipo de Serviço", data.serviceType);
    if (data.isCompleted !== undefined)
      rowToUpdate.set("Realizado", data.isCompleted ? "S" : "N");
    if (data.observations !== undefined)
      rowToUpdate.set("Observações", data.observations);

    await rowToUpdate.save();

    console.log("✅ Cliente atualizado com sucesso!");

    return {
      success: true,
      message: "Cliente atualizado com sucesso!",
    };
  } catch (error) {
    console.error("❌ Erro ao atualizar cliente:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro desconhecido",
      message: "Falha ao atualizar cliente",
    };
  }
}

export async function deleteCustomer(id: number) {
  try {
    console.log("🗑️ Excluindo cliente ID:", id);

    const serviceAccountAuth = new JWT({
      email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const doc = new GoogleSpreadsheet(
      process.env.GOOGLE_SHEET_ID!,
      serviceAccountAuth
    );
    await doc.loadInfo();

    const sheet = await getOrCreateCustomerSheet(doc);
    const rows = await sheet.getRows();

    const rowToDelete = rows.find(
      (row) => Number.parseInt(row.get("ID")) === id
    );

    if (!rowToDelete) {
      throw new Error("Cliente não encontrado");
    }

    const customerName = rowToDelete.get("Nome");
    await rowToDelete.delete();

    console.log("✅ Cliente excluído com sucesso!");

    return {
      success: true,
      message: `Cliente ${customerName} excluído com sucesso!`,
    };
  } catch (error) {
    console.error("❌ Erro ao excluir cliente:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro desconhecido",
      message: "Falha ao excluir cliente",
    };
  }
}
