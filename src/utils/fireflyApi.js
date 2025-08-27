import axios from "axios";
import EncryptedStorage from "react-native-encrypted-storage";

// 🔑 Load host + token from EncryptedStorage
export const getAuthConfig = async () => {
  try {
    const credentials = await EncryptedStorage.getItem("firefly_credentials");
    if (!credentials) throw new Error("No saved credentials. Please login again.");
    const { host, token } = JSON.parse(credentials);

    return {
      baseURL: host.replace(/\/+$/, "") + "/api/v1/",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    };
  } catch (error) {
    console.error("❌ Error loading credentials:", error);
    throw error;
  }
};

//
// 📊 Net Worth
//
export const fetchNetWorth = async () => {
  try {
    const config = await getAuthConfig();
    const response = await axios.get("accounts", config);

    let total = 0;
    const validTypes = ["asset", "cash", "bank", "liabilities"];

    response.data.data.forEach((account) => {
      const attrs = account.attributes;
      const balance = parseFloat(attrs.current_balance ?? 0);
      if (validTypes.includes(attrs.type) && attrs.active && attrs.include_net_worth) {
        total += balance;
      }
    });

    return total;
  } catch (error) {
    console.error("❌ Error fetching net worth:", error.response?.data || error.message);
    throw error;
  }
};

//
// 📈 Income vs Expense (summary for chart)
//
export const fetchTransactionsSummary = async (start, end) => {
  try {
    const config = await getAuthConfig();
    const response = await axios.get("transactions", {
      ...config,
      params: { start, end },
    });

    let income = {};
    let expense = {};

    response.data.data.forEach((tx) => {
      const t = tx.attributes;
      if (!t?.date) return; // guard against missing date

      const date = t.date.slice(0, 10); // yyyy-mm-dd
      const amount = parseFloat(t.amount ?? 0);

      if (t.type === "deposit") {
        income[date] = (income[date] || 0) + amount;
      } else if (t.type === "withdrawal") {
        expense[date] = (expense[date] || 0) + amount;
      }
    });

    const dates = Array.from(new Set([...Object.keys(income), ...Object.keys(expense)])).sort();

    return {
      income: dates.map((d, idx) => ({ x: idx + 1, y: income[d] || 0 })),
      expense: dates.map((d, idx) => ({ x: idx + 1, y: Math.abs(expense[d] || 0) })),
    };
  } catch (error) {
    console.error("❌ Error fetching income/expense summary:", error.response?.data || error.message);
    throw error;
  }
};

//
// 🥧 Expenses by Category
//
export const fetchExpensesByCategory = async (start, end) => {
  try {
    const config = await getAuthConfig();
    const response = await axios.get("transactions", {
      ...config,
      params: { start, end, type: "withdrawal" },
    });

    let categories = {};
    response.data.data.forEach((tx) => {
      const t = tx.attributes;
      const category = t.category_name || "Uncategorized";
      const amount = parseFloat(t.amount ?? 0);
      categories[category] = (categories[category] || 0) + amount;
    });

    return Object.entries(categories).map(([name, value]) => ({ x: name, y: value }));
  } catch (error) {
    console.error("❌ Error fetching expenses by category:", error.response?.data || error.message);
    throw error;
  }
};

//
// 🕘 Latest Transactions
//
export const fetchLatestTransactions = async (limit = 10) => {
  try {
    const config = await getAuthConfig();
    const response = await axios.get("transactions", {
      ...config,
      params: { limit, page: 1, order: "desc" },
    });

    return response.data.data.map((tx) => ({
      id: tx.id,
      type: tx.attributes.type,
      date: tx.attributes.date,
      description: tx.attributes.description,
      amount: parseFloat(tx.attributes.amount ?? 0),
      category: tx.attributes.category_name,
    }));
  } catch (error) {
    console.error("❌ Error fetching latest transactions:", error.response?.data || error.message);
    throw error;
  }
};
