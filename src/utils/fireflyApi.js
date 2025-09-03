import axios from "axios";
import EncryptedStorage from "react-native-encrypted-storage";
import moment from "moment";

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
      const t = tx.attributes?.transactions?.[0];
      if (!t?.date) return;

      const date = t.date.slice(0, 10);
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
      const t = tx.attributes?.transactions?.[0];
      const category = t?.category_name || "Uncategorized";
      const amount = parseFloat(t?.amount ?? 0);
      categories[category] = (categories[category] || 0) + amount;
    });

    return Object.entries(categories).map(([name, value]) => ({ x: name, y: value }));
  } catch (error) {
    console.error("❌ Error fetching expenses by category:", error.response?.data || error.message);
    throw error;
  }
};

//
// 📊 Income vs Expense Over Time
//
export const fetchIncomeExpenseOverTime = async () => {
  try {
    const config = await getAuthConfig();

    const start = moment().subtract(6, "months").format("YYYY-MM-DD");
    const end = moment().format("YYYY-MM-DD");

    const response = await axios.get("chart/account/overview", {
      ...config,
      params: { start, end, group_by: "month" },
    });

    return Object.keys(response.data).map((date) => {
      const entry = response.data[date];
      return {
        x: date,
        income: parseFloat(entry.income ?? 0),
        expense: parseFloat(entry.expense ?? 0),
      };
    });
  } catch (err) {
    console.error("Error fetching income vs expense:", err.response?.data || err.message);
    return [];
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
      type: tx.attributes?.transactions?.[0]?.type,
      date: tx.attributes?.transactions?.[0]?.date,
      description: tx.attributes?.transactions?.[0]?.description,
      amount: parseFloat(tx.attributes?.transactions?.[0]?.amount ?? 0),
      category: tx.attributes?.transactions?.[0]?.category_name,
    }));
  } catch (error) {
    console.error("❌ Error fetching latest transactions:", error.response?.data || error.message);
    throw error;
  }
};

//
// 🏦 Accounts list
//
export const fetchAccounts = async () => {
  try {
    const config = await getAuthConfig();
    const response = await axios.get("accounts", config);

    return response.data.data
      .filter((acc) => ["asset", "cash", "bank", "liabilities"].includes(acc.attributes.type))
      .map((acc) => ({
        id: acc.id,
        name: acc.attributes.name,
        type: acc.attributes.type,
        balance: parseFloat(acc.attributes.current_balance ?? 0),
      }));
  } catch (error) {
    console.error("❌ Error fetching accounts:", error.response?.data || error.message);
    return [];
  }
};

//
// 📂 Categories
//
export const fetchCategories = async () => {
  try {
    const config = await getAuthConfig();
    const response = await axios.get("categories", config);

    return response.data.data.map((c) => ({
      id: c.id,
      name: c.attributes.name,
    }));
  } catch (error) {
    console.error("❌ Error fetching categories:", error.response?.data || error.message);
    return [];
  }
};

//
// 🏷️ Tags
//
export const fetchTags = async () => {
  try {
    const config = await getAuthConfig();
    const response = await axios.get("tags", config);

    return response.data.data.map((t) => ({
      id: t.id,
      name: t.attributes.tag,
    }));
  } catch (error) {
    console.error("❌ Error fetching tags:", error.response?.data || error.message);
    return [];
  }
};

//
// 📑 Reports (Accounts / Categories / Tags)
//
export const fetchReportTransactions = async ({
  selectedAccounts = [],
  selectedCategories = [],
  selectedTags = [],
  dateRange = "30days",
  customStartDate = null,
  customEndDate = null,
  page = 1,
  limit = 25,
}) => {
  try {
    const config = await getAuthConfig();

    // date filter
    let start = null;
    let end = null;
    const today = new Date();

    if (dateRange === "custom") {
      start = customStartDate ? customStartDate.toISOString().split("T")[0] : null;
      end = customEndDate ? customEndDate.toISOString().split("T")[0] : null;
    } else {
      switch (dateRange) {
        case "30days":
          start = new Date(today.setDate(today.getDate() - 30)).toISOString().split("T")[0];
          end = new Date().toISOString().split("T")[0];
          break;
        case "6months":
          start = new Date(today.setMonth(today.getMonth() - 6)).toISOString().split("T")[0];
          end = new Date().toISOString().split("T")[0];
          break;
        case "ytd":
          start = new Date(new Date().getFullYear(), 0, 1).toISOString().split("T")[0];
          end = new Date().toISOString().split("T")[0];
          break;
      }
    }

    // params
    let params = { start, end, page, limit };

    if (selectedAccounts.length > 0) params["accounts"] = selectedAccounts.join(",");
    if (selectedCategories.length > 0) params["categories"] = selectedCategories.join(",");
    if (selectedTags.length > 0) params["tags"] = selectedTags.join(",");

    const response = await axios.get("transactions", {
      ...config,
      params,
    });

    return response.data.data;
  } catch (err) {
    console.error("❌ Error fetching report transactions:", err.response?.data || err.message);
    throw err;
  }
};
