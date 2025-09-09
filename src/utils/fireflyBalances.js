import axios from "axios";
import { getAuthConfig } from "../utils/fireflyApi";

/**
 * Fetch actual balance of an account for today (or any date)
 */
export async function fetchActualBalance(accountId, date = null) {
  try {
    const config = await getAuthConfig();
    let url = `/accounts/${accountId}`;

    if (!date) {
      // For current balance, Firefly requires tomorrow's date
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      date = tomorrow.toISOString().split("T")[0];
    }

    url += `?date=${date}`;

    const res = await axios.get(url, config);

    const balanceStr = res.data?.data?.attributes?.current_balance;

    return balanceStr ? parseFloat(balanceStr) : 0;
  } catch (err) {
    console.error(`❌ fetchActualBalance error for account ${accountId}:`, err.message);
    return 0;
  }
}
