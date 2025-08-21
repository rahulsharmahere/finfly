// fireflyApi.js
import axios from 'axios';
import EncryptedStorage from 'react-native-encrypted-storage';

// 🔑 Load host + token from EncryptedStorage
export const getAuthConfig = async () => {
  try {
    const credentials = await EncryptedStorage.getItem('firefly_credentials');
    if (!credentials) {
      throw new Error('No saved credentials. Please login again.');
    }

    const { host, token } = JSON.parse(credentials);

    if (!host || !token) {
      throw new Error('Missing host or token in saved credentials.');
    }

    return {
      baseURL: host.replace(/\/+$/, '') + '/api/v1/',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    };
  } catch (error) {
    console.error('Error loading credentials:', error);
    throw error;
  }
};

// 📊 Fetch Net Worth
export const fetchNetWorth = async () => {
  try {
    const config = await getAuthConfig();
    const response = await axios.get('accounts', config);

    let total = 0;
    const validTypes = ['asset', 'cash', 'liabilities', 'bank'];

    response.data.data.forEach((account, index) => {
      const attrs = account.attributes;
      const type = attrs.type;
      const name = attrs.name;
      const balance = parseFloat(attrs.current_balance || 0);
      const isActive = attrs.active === true;
      const includeInNetWorth = attrs.include_net_worth === true;

      // Debug: print first account object
      if (index === 0) {
        console.log('🔍 Sample account object:', account);
      }

      if (validTypes.includes(type) && isActive && includeInNetWorth) {
        console.log(`✅ Including [${name}] (${type}) balance: ${balance}`);
        total += balance;
      } else {
        console.log(
          `❌ Skipping [${name}] type: ${type}, active: ${isActive}, include_net_worth: ${includeInNetWorth}`
        );
      }
    });

    return total;
  } catch (error) {
    console.error('Error fetching net worth:', error.response?.data || error.message);
    throw error;
  }
};
