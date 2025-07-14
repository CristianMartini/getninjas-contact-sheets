// Script para debugar problemas com Google Sheets
import { GoogleSpreadsheet } from "google-spreadsheet"
import { JWT } from "google-auth-library"

async function debugSheetsConnection() {
  try {
    console.log("🔍 Iniciando debug do Google Sheets...\n")

    // Verificar variáveis de ambiente
    console.log("📋 Variáveis de ambiente:")
    console.log(
      "✓ GOOGLE_SERVICE_ACCOUNT_EMAIL:",
      process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL ? "✅ Definido" : "❌ NÃO DEFINIDO",
    )
    console.log("✓ GOOGLE_PRIVATE_KEY:", process.env.GOOGLE_PRIVATE_KEY ? "✅ Definido" : "❌ NÃO DEFINIDO")
    console.log("✓ GOOGLE_SHEET_ID:", process.env.GOOGLE_SHEET_ID ? "✅ Definido" : "❌ NÃO DEFINIDO")
    console.log("")

    if (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY || !process.env.GOOGLE_SHEET_ID) {
      throw new Error("❌ Variáveis de ambiente não configuradas")
    }

    // Configurar autenticação
    console.log("🔐 Configurando autenticação...")
    const serviceAccountAuth = new JWT({
      email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    })

    // Conectar à planilha
    console.log("📊 Conectando à planilha...")
    const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID, serviceAccountAuth)
    await doc.loadInfo()

    console.log("✅ Conexão estabelecida!")
    console.log(`📄 Título: ${doc.title}`)
    console.log(`📑 Número de abas: ${doc.sheetCount}\n`)

    // Verificar primeira aba
    const sheet = doc.sheetsByIndex[0]
    if (sheet) {
      await sheet.loadHeaderRow()

      console.log("📋 Informações da primeira aba:")
      console.log(`   Nome: ${sheet.title}`)
      console.log(`   Linhas: ${sheet.rowCount}`)
      console.log(`   Colunas: ${sheet.columnCount}`)
      console.log("")

      console.log("🏷️  Cabeçalhos encontrados:")
      sheet.headerValues.forEach((header, index) => {
        console.log(`   ${index + 1}. "${header}"`)
      })

      // Verificar se os cabeçalhos esperados existem
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
      ]

      console.log("\n🔍 Verificação de cabeçalhos:")
      expectedHeaders.forEach((expected, index) => {
        const found = sheet.headerValues[index]
        const match = found === expected
        console.log(`   ${index + 1}. "${expected}" ${match ? "✅" : "❌"} ${!match ? `(encontrado: "${found}")` : ""}`)
      })

      // Testar adição de linha
      console.log("\n🧪 Testando adição de linha de teste...")
      const testRow = await sheet.addRow({
        ID: 999,
        "Código do cliente": "TEST123",
        Nome: "Cliente Teste",
        Email: "teste@exemplo.com",
        Telefone: "(11) 99999-9999",
        Endereço: "Rua Teste, 123",
        Cidade: "São Paulo",
        Estado: "SP",
        CEP: "01234-567",
        "Fonte de Aquisição": "Teste",
        "Tipo de Serviço": "Teste",
        Realizado: "N",
        Observações: "Linha de teste - pode ser removida",
        "Data de Registro": new Date().toLocaleDateString("pt-BR"),
      })

      console.log(`✅ Linha de teste adicionada na posição: ${testRow.rowNumber}`)

      // Verificar se os dados foram salvos corretamente
      console.log("\n📊 Dados salvos na linha de teste:")
      expectedHeaders.forEach((header) => {
        console.log(`   ${header}: "${testRow.get(header)}"`)
      })

      // Remover linha de teste
      console.log("\n🗑️  Removendo linha de teste...")
      await testRow.delete()
      console.log("✅ Linha de teste removida")
    } else {
      console.log("❌ Nenhuma aba encontrada na planilha")
    }

    console.log("\n🎉 Debug concluído com sucesso!")
  } catch (error) {
    console.error("\n❌ ERRO NO DEBUG:")
    console.error("   Mensagem:", error.message)

    if (error.message.includes("ENOTFOUND")) {
      console.error("   💡 Dica: Problema de conectividade com a internet")
    } else if (error.message.includes("403")) {
      console.error("   💡 Dica: Conta de serviço sem permissão na planilha")
    } else if (error.message.includes("404")) {
      console.error("   💡 Dica: ID da planilha incorreto")
    } else if (error.message.includes("401")) {
      console.error("   💡 Dica: Credenciais da conta de serviço inválidas")
    }

    console.error("\n🔧 Soluções:")
    console.error("   1. Verifique se o email da conta de serviço tem acesso à planilha")
    console.error("   2. Confirme se o ID da planilha está correto")
    console.error("   3. Verifique se a chave privada não foi corrompida")
    console.error("   4. Teste a conexão com a internet")
  }
}

// Executar debug
debugSheetsConnection()
