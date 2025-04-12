import axios from 'axios';

// The backend routes are mounted at /api/v1
const API_BASE_URL = 'http://localhost:8000/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add debug logging for troubleshooting
const logRequest = (method, url, data) => {
  console.log(`API ${method} Request:`, `${API_BASE_URL}${url}`, data ? data : '');
};

export const submitQuery = async (queryData) => {
  try {
    logRequest('POST', '/query', queryData);
    const response = await api.post('/query', queryData);
    return response.data;
  } catch (error) {
    console.error('Error submitting query:', error);
    console.error('Full error details:', {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data
    });
    throw error;
  }
};

export const uploadFile = async (file, technology, query = null) => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('technology', technology);
    
    if (query) {
      formData.append('query', query);
    }
    
    logRequest('POST', '/upload-file', { file: file.name, technology, query });
    const response = await api.post('/upload-file', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data;
  } catch (error) {
    console.error('Error uploading file:', error);
    console.error('Full error details:', {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data
    });
    throw error;
  }
};

export const getSupportedTechnologies = async () => {
  try {
    logRequest('GET', '/technologies');
    const response = await api.get('/technologies');
    return response.data.technologies;
  } catch (error) {
    console.error('Error getting technologies:', error);
    console.error('Full error details:', {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data
    });
    throw error;
  }
};

export const healthCheck = async () => {
  try {
    logRequest('GET', '/health');
    const response = await api.get('/health');
    return response.data;
  } catch (error) {
    console.error('Health check failed:', error);
    console.error('Full error details:', {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data
    });
    throw error;
  }
};

// Try to make a health check request when this module loads
healthCheck()
  .then(data => console.log('API reachable:', data))
  .catch(err => console.warn('API not reachable at startup. This is expected during build.'));

export default api;