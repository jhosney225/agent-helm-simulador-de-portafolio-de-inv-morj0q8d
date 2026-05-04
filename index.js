
```javascript
const Anthropic = require("@anthropic-ai/sdk");
const fs = require("fs");
const readline = require("readline");

const client = new Anthropic();

// Simulador de portafolio de inversiones
class PortfolioSimulator {
  constructor() {
    this.portfolio = {};
    this.history = [];
    this.conversationHistory = [];
  }

  addInvestment(symbol, shares, price) {
    if (!this.portfolio[symbol]) {
      this.portfolio[symbol] = { shares: 0, purchasePrice: 0, history: [] };
    }
    this.portfolio[symbol].shares += shares;
    this.portfolio[symbol].purchasePrice = price;
    this.portfolio[symbol].history.push({
      date: new Date().toISOString(),
      price: price,
      shares: shares,
    });
  }

  getPortfolioValue(currentPrices) {
    let totalValue = 0;
    const breakdown = {};

    for (const [symbol, data] of Object.entries(this.portfolio)) {
      const currentPrice = currentPrices[symbol] || data.purchasePrice;
      const value = data.shares * currentPrice;
      totalValue += value;
      breakdown[symbol] = {
        shares: data.shares,
        currentPrice: currentPrice,
        totalValue: value,
        gain:
          ((currentPrice - data.purchasePrice) / data.purchasePrice) * 100,
      };
    }

    return { totalValue, breakdown };
  }

  simulatePrice(basePrice, volatility = 0.05) {
    const change = (Math.random() - 0.5) * 2 * volatility;
    return basePrice * (1 + change);
  }

  generateReport() {
    const currentPrices = {
      AAPL: 150.5,
      GOOGL: 140.2,
      MSFT: 380.1,
      AMZN: 175.8,
      TSLA: 242.3,
    };

    const portfolio = this.getPortfolioValue(currentPrices);

    let report = "📊 REPORTE DE PORTAFOLIO DE INVERSIONES\n";
    report += "=".repeat(50) + "\n\n";
    report += `💰 Valor Total del Portafolio: $${portfolio.totalValue.toFixed(2)}\n\n`;
    report += "DESGLOSE POR ACTIVO:\n";
    report += "-".repeat(50) + "\n";

    for (const [symbol, data] of Object.entries(portfolio.breakdown)) {
      const gainIcon = data.gain >= 0 ? "📈" : "📉";
      report += `${gainIcon} ${symbol}\n`;
      report += `   Acciones: ${data.shares}\n`;
      report += `   Precio Actual: $${data.currentPrice.toFixed(2)}\n`;
      report += `   Valor Total: $${data.totalValue.toFixed(2)}\n`;
      report += `   Ganancia/Pérdida: ${data.gain.toFixed(2)}%\n\n`;
    }

    return { report, portfolio };
  }
}

async function chat(userMessage, simulator) {
  // Add user message to conversation history
  simulator.conversationHistory.push({
    role: "user",
    content: userMessage,
  });

  const systemPrompt = `You are an expert investment portfolio advisor AI. You help users analyze and manage their investment portfolios.

Current Portfolio State:
${JSON.stringify(simulator.portfolio, null, 2)}

Available Commands:
- "add SYMBOL SHARES PRICE" - Add investment
- "report" - Get portfolio report
- "simulate" - Run price simulation
- "help" - Show available commands

Respond naturally and helpfully. When users ask about their portfolio, provide detailed analysis. Be professional but friendly.`;

  try {
    const response = await client.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 1024,
      system: systemPrompt,
      messages: simulator.conversationHistory,
    });

    const assistantMessage =
      response.content[0].type === "text" ? response.content[0].text : "";

    // Add assistant response to history
    simulator.conversationHistory.push({
      role: "assistant",
      content: assistantMessage,
    });

    return assistantMessage;
  } catch (error) {
    console.error("Error calling API:", error);
    throw error;
  }
}

function createSimpleChart(title, data, width = 60) {
  let chart = `\n${title}\n`;
  chart += "=".repeat(width) + "\n";

  const maxValue = Math.max(...Object.values(data));
  const scale = (width - 20) / maxValue;

  for (const [label, value] of Object.entries(data)) {
    const barLength = Math.floor(value * scale);
    const bar = "█".repeat(Math.max(1, barLength));
    const percentage = ((value / maxValue) * 100).toFixed(1);
    chart += `${label.padEnd(10)} │ ${bar} ${percentage}%\n`;
  }

  return chart;
}

async function main() {
  console.log("🚀 SIMULADOR DE PORTAFOLIO DE INVERSIONES CON IA");
  console.log("================================================\n");

  const simulator = new PortfolioSimulator();

  // Initialize portfolio with sample investments
  simulator.addInvestment("AAPL", 10, 150.5);
  simulator.addInvestment("GOOGL", 5, 140.2);
  simulator.addInvestment("MSFT", 8, 380.1);

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  console.log("Portafolio inicial