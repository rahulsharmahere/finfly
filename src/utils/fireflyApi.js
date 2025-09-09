import axios from "axios";
import EncryptedStorage from "react-native-encrypted-storage";
import moment from "moment";

//
// 🔑 Load host + token from EncryptedStorage
//
export const getAuthConfig = async () => {
  try {
    const credentials = await EncryptedStorage.getItem("firefly_credentials");
    if (!credentials) throw new Error("No saved credentials. Please login again.");
    const { host, token } = JSON.parse(credentials);

    return {
      baseURL: host.replace(/\/+$/, "") + "/api/v1",
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
// 🏦 Accounts with live balance
//
export const fetchAccountsWithBalance = async () => {
  try {
    const config = await getAuthConfig();
    const response = await axios.get("/accounts", config);
    const accounts = response.data.data;

    return accounts
      .filter((acc) => ["asset", "cash", "bank", "liability"].includes(acc.attributes.type))
      .map((acc) => {
        const balanceStr = acc.attributes.meta?.balance?.native_currency?.amount ?? 0;
        return {
          id: acc.id,
          name: acc.attributes.name,
          type: acc.attributes.type,
          balance: parseFloat(balanceStr),
          currency: acc.attributes.currency_symbol,
        };
      });
  } catch (error) {
    console.error("❌ Error fetching accounts with balance:", error.response?.data || error.message);
    return [];
  }
};

//
// 📊 Net Worth
//
export const fetchNetWorth = async () => {
  try {
    const accounts = await fetchAccountsWithBalance();
    let total = 0;

    accounts.forEach((acc) => {
      if (["asset", "cash", "bank"].includes(acc.type)) {
        total += acc.balance;
      } else if (acc.type === "liability") {
        total -= acc.balance;
      }
    });

    return total;
  } catch (error) {
    console.error("❌ Error fetching net worth:", error.response?.data || error.message);
    return 0;
  }
};

//
// 📈 Income vs Expense (summary for chart)
//
export const fetchTransactionsSummary = async (start, end) => {
  try {
    const config = await getAuthConfig();
    const response = await axios.get("/transactions", {
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
    const response = await axios.get("/transactions", {
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

    const response = await axios.get("/chart/account/overview", {
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
    const response = await axios.get("/transactions", {
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
// 📂 Categories
//
export const fetchCategories = async () => {
  try {
    const config = await getAuthConfig();
    const response = await axios.get("/categories", config);

    return response.data.data.map((c) => ({ id: c.id, name: c.attributes.name }));
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
    const response = await axios.get("/tags", config);

    return response.data.data.map((t) => ({ id: t.id, name: t.attributes.tag }));
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

    let params = { start, end, page, limit };
    if (selectedAccounts.length > 0) params["accounts"] = selectedAccounts.join(",");
    if (selectedCategories.length > 0) params["categories"] = selectedCategories.join(",");
    if (selectedTags.length > 0) params["tags"] = selectedTags.join(",");

    const response = await axios.get("/transactions", { ...config, params });
    return response.data.data;
  } catch (err) {
    console.error("❌ Error fetching report transactions:", err.response?.data || err.message);
    throw err;
  }
};

//
// 📜 Transactions by Account (for AccountDetailScreen)
//
export const fetchTransactionsByAccount = async (
  accountId,
  startDate,
  endDate,
  page = 1,
  limit = 25
) => {
  try {
    const config = await getAuthConfig();

    const params = {
      start: startDate || null,
      end: endDate || new Date().toISOString().split("T")[0],
      page,
      limit,
    };

    const response = await axios.get(`/accounts/${accountId}/transactions`, {
      baseURL: config.baseURL,
      headers: config.headers,
      params,
    });

    if (!response.data?.data) return { data: [], meta: { last_page: 1 } };

    const data = response.data.data.map((tx) => {
      const attrs = tx.attributes;
      const t = attrs.transactions?.[0] || {};
      return {
        id: tx.id,
        description: attrs.description || t.description || "No description",
        date: attrs.date || t.date,
        type: attrs.transaction_type || t.type,
        amount: parseFloat(t.amount || 0).toFixed(2),
        currency: t.currency_code || "",
      };
    });

    const meta = response.data.meta || { last_page: 1 };
    return { data, meta };
  } catch (error) {
    console.error("❌ Error fetching transactions by account:", error.response?.data || error.message);
    return { data: [], meta: { last_page: 1 } };
  }
};

//
// ➕ Create Account
//
export const createAccount = async ({
  name,
  type, // asset | liability | cash | bank
  accountNumber,
  openingBalance,
  openingBalanceDate,
  accountRole, // only for asset
}) => {
  try {
    const config = await getAuthConfig();

    const payload = {
      name,
      type,
      account_number: accountNumber,
      opening_balance: openingBalance,
      opening_balance_date: openingBalanceDate,
    };

    if (type === "asset" && accountRole) {
      payload.account_role = accountRole;
    }

    const response = await axios.post("/accounts", payload, config);
    return response.data;
  } catch (error) {
    console.error("❌ Error creating account:", error.response?.data || error.message);
    throw error;
  }
};

//
// ✏️ Update Account
//
export const updateAccount = async (id, accountData) => {
  try {
    const config = await getAuthConfig();
    const response = await axios.put(`/accounts/${id}`, accountData, config);
    return response.data;
  } catch (error) {
    console.error("❌ Error updating account:", error.response?.data || error.message);
    throw error;
  }
};

//
// 🔹 Fetch actual balance of an account
//
export const fetchActualBalance = async (accountId) => {
  try {
    const config = await getAuthConfig();
    const res = await axios.get(`/accounts/${accountId}`, config);

    const balanceStr = res.data?.data?.attributes?.meta?.balance?.native_currency?.amount;
    return balanceStr ? parseFloat(balanceStr) : 0;
  } catch (err) {
    console.error("❌ fetchActualBalance error:", err.message);
    return 0;
  }
};
