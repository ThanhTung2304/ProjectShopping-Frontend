import axiosClient from './axiosClient';

export const sendChatMessage = async (message) => {
  return axiosClient.post('/api/chat', { message });
};
