import AsyncStorage from '@react-native-async-storage/async-storage';

// Simple btoa polyfill for React Native
const btoa = (input: string) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
  let output = '';
  for (let block = 0, charCode, i = 0, map = chars;
    input.charAt(i | 0) || (map = '=', i % 1);
    output += map.charAt(63 & block >> 8 - i % 1 * 8)) {
    charCode = input.charCodeAt(i += 3 / 4);
    block = block << 8 | charCode;
  }
  return output;
};

const CLIENT_ID = process.env.EXPO_PUBLIC_FATSECRET_CLIENT_ID;
const CLIENT_SECRET = process.env.EXPO_PUBLIC_FATSECRET_CLIENT_SECRET;
const TOKEN_URL = 'https://oauth.fatsecret.com/connect/token';
const SEARCH_URL = 'https://platform.fatsecret.com/rest/server.api';

interface FatSecretToken {
  access_token: string;
  expires_at: number;
}

export const getAccessToken = async (): Promise<string | null> => {
  try {
    const storedToken = await AsyncStorage.getItem('fatsecret_token');
    if (storedToken) {
      const tokenData: FatSecretToken = JSON.parse(storedToken);
      // Check if token is still valid (with 5 min buffer)
      if (tokenData.expires_at > Date.now() + 5 * 60 * 1000) {
        return tokenData.access_token;
      }
    }

    if (!CLIENT_ID || !CLIENT_SECRET) {
      console.error('FatSecret credentials missing. ID:', CLIENT_ID, 'Secret:', CLIENT_SECRET);
      return null;
    }

    const authHeader = `Basic ${btoa(`${CLIENT_ID}:${CLIENT_SECRET}`)}`;
    
    const response = await fetch(TOKEN_URL, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials&scope=basic',
    });

    const data = await response.json();
    if (data.access_token) {
      const tokenInfo: FatSecretToken = {
        access_token: data.access_token,
        expires_at: Date.now() + data.expires_in * 1000,
      };
      await AsyncStorage.setItem('fatsecret_token', JSON.stringify(tokenInfo));
      return data.access_token;
    }

    return null;
  } catch (error) {
    console.error('Error getting FatSecret token:', error);
    return null;
  }
};

export const searchFood = async (query: string) => {
  try {
    const token = await getAccessToken();
    if (!token) return [];

    const params = new URLSearchParams({
      method: 'foods.search',
      search_expression: query,
      format: 'json',
      max_results: '5',
    });

    const response = await fetch(`${SEARCH_URL}?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    console.log('FatSecret Search Response:', JSON.stringify(data, null, 2));
    
    if (data.foods && data.foods.food) {
      const foodArray = Array.isArray(data.foods.food) 
        ? data.foods.food 
        : [data.foods.food];
      
      return foodArray.map((item: any) => {
        const desc = item.food_description || '';
        console.log('Parsing description:', desc);
        const caloriesMatch = desc.match(/Calories: (\d+)kcal/i);
        const fatMatch = desc.match(/Fat: ([\d\.]+)g/i);
        const carbsMatch = desc.match(/Carbs: ([\d\.]+)g/i);
        const proteinMatch = desc.match(/Protein: ([\d\.]+)g/i);
        const servingMatch = desc.split(' - ')[0];

        return {
          id: item.food_id,
          name: item.food_name,
          brand: item.brand_name,
          serving: servingMatch,
          calories: caloriesMatch ? parseInt(caloriesMatch[1]) : 0,
          fat: fatMatch ? parseFloat(fatMatch[1]) : 0,
          carbs: carbsMatch ? parseFloat(carbsMatch[1]) : 0,
          protein: proteinMatch ? parseFloat(proteinMatch[1]) : 0,
        };
      });
    }

    return [];
  } catch (error) {
    console.error('Error searching FatSecret:', error);
    return [];
  }
};
