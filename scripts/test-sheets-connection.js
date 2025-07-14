// Script para testar a conexão com Google Sheets
import { GoogleSpreadsheet } from "google-spreadsheet"
import { JWT } from "google-auth-library"

async function testSheetsConnection() {
  try {
    console.log("🔍 Testando conexão com Google Sheets...\n")

    // Verificar variáveis de ambiente
    console.log("📋 Verificando variáveis de ambiente:")
    console.log(
      "✓ GOOGLE_SERVICE_ACCOUNT_EMAIL:",
      process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL ? "Definido" : "❌ NÃO DEFINIDO",
    )
    console.log("✓ GOOGLE_PRIVATE_KEY:", process.env.GOOGLE_PRIVATE_KEY ? "Definido" : "❌ NÃO DEFINIDO")
    console.log("✓ GOOGLE_SHEET_ID:", process.env.GOOGLE_SHEET_ID ? "Definido" : "❌ NÃO DEFINIDO")
    console.log("")

    if (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY || !process.env.GOOGLE_SHEET_ID) {
      throw new Error("❌ Variáveis de ambiente não estão configuradas corretamente")
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

    console.log("✅ CONEXÃO BEM-SUCEDIDA!\n")
    console.log("📄 Informações da Planilha:")
    console.log(`   Título: ${doc.title}`)
    console.log(`   Número de abas: ${doc.sheetCount}`)
    console.log(`   Criado em: ${doc.createdTime}`)
    console.log(`   Última modificação: ${doc.updatedTime}\n`)

    // Listar abas
    console.log("📑 Abas disponíveis:")
    doc.sheetsByIndex.forEach((sheet, index) => {
      console.log(`   ${index + 1}. ${sheet.title} (${sheet.rowCount} linhas, ${sheet.columnCount} colunas)`)
    })

    // Verificar primeira aba
    if (doc.sheetsByIndex[0]) {
      const firstSheet = doc.sheetsByIndex[0]
      await firstSheet.loadHeaderRow()

      console.log("\n🏷️  Cabeçalhos da primeira aba:")
      if (firstSheet.headerValues.length > 0) {
        firstSheet.headerValues.forEach((header, index) => {
          console.log(`   ${index + 1}. ${header}`)
        })
      } else {
        console.log("   ⚠️  Nenhum cabeçalho encontrado")
      }
    }

    console.log("\n🎉 Teste concluído com sucesso!")
    console.log("💡 O sistema está pronto para cadastrar clientes.")
  } catch (error) {
    console.error("\n❌ ERRO NA CONEXÃO:")
    console.error("   Mensagem:", error.message)

    if (error.message.includes("ENOTFOUND")) {
      console.error("   💡 Dica: Verifique sua conexão com a internet")
    } else if (error.message.includes("403")) {
      console.error("   💡 Dica: Verifique se o email da conta de serviço tem acesso à planilha")
    } else if (error.message.includes("404")) {
      console.error("   💡 Dica: Verifique se o ID da planilha está correto")
    } else if (error.message.includes("401")) {
      console.error("   💡 Dica: Verifique se as credenciais da conta de serviço estão corretas")
    }

    console.error("\n🔧 Passos para resolver:")
    console.error("   1. Verifique se todas as variáveis de ambiente estão definidas")
    console.error("   2. Confirme se o email da conta de serviço tem acesso à planilha")
    console.error("   3. Verifique se o ID da planilha está correto")
    console.error("   4. Confirme se a chave privada está formatada corretamente")
  }
}

// Executar o teste
testSheetsConnection()
