const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'https://smartpresence-backend-u3kb.onrender.com/api'; // Fallback for deployed backend

/**
 * Retrieves the JWT token from localStorage.
 * @returns {string|null} The JWT token or null if not found.
 */
const getToken = () => {
  return localStorage.getItem('smartpresence_token');
};

/**
 * Stores the JWT token in localStorage.
 * @param {string} token The JWT token to store.
 */
export const storeToken = (token) => {
  localStorage.setItem('smartpresence_token', token);
};

/**
 * Removes the JWT token from localStorage.
 */
export const removeToken = () => {
  localStorage.removeItem('smartpresence_token');
};

/**
 * A generic function to make API requests.
 * It automatically adds the JWT token to the Authorization header.
 *
 * @param {string} endpoint The API endpoint (e.g., '/auth/login').
 * @param {string} method The HTTP method (e.g., 'GET', 'POST').
 * @param {object} [body=null] The request body for POST/PUT requests.
 * @param {boolean} [isPublic=false] If true, token will not be attached (for public routes like login/register).
 * @returns {Promise<object>} A promise that resolves to the JSON response from the API.
 * @throws {Error} If the API response is not ok or if there's a network error.
 */
export const apiRequest = async (
  endpoint,
  method = 'GET',
  body = null,
  isPublic = false
) => {
  const headers = {
    'Content-Type': 'application/json',
  };

  const token = getToken();
  if (token && !isPublic) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    method,
    headers,
  };

  if (body) {
    config.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

    if (!response.ok) {
      // Attempt to parse error response from API, otherwise use statusText
      let errorData;
      try {
        errorData = await response.json();
      } catch {
        // Ignore if response is not JSON
      }
      const errorMessage =
        errorData?.error || errorData?.message || response.statusText;
      throw new Error(`API request failed: ${response.status} ${errorMessage}`);
    }

    // If response has no content (e.g. 204 No Content for DELETE)
    if (response.status === 204) {
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('API Request Error:', error);
    throw error; // Re-throw to be caught by the caller
  }
};

// Example Usage (can be removed or moved to respective component files):
// export const loginUser = (credentials) => apiRequest('/auth/login', 'POST', credentials, true);
// export const fetchUserProfile = () => apiRequest('/users/profile', 'GET');
