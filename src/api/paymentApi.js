import axiosClient from "./axiosClient";

const paymentApi = {
  createVnpayPayment: ({ orderId }) =>
    axiosClient.post("/api/payments/vnpay/create", { orderId }),
};

export default paymentApi;
