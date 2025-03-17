/* eslint-disable @typescript-eslint/no-explicit-any */
import ApiClient from "@/services/nombaApiClient";
import { useNombaStore } from "@/store/Nomba";
import { useAuthStore } from "@/store/UserId";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";

export const useNombaPayment  = () => {
  // const apiClient = new ApiClient<any, {email: string, amount: number, plan: string}>("/v1/auth/token/issue");
  const { auth_response } = useNombaStore();
  const { auth } = useAuthStore();
  return useMutation({
      mutationFn: (data: {
        order: {
          amount: number;
          callbackUrl: string,
          currency: string,
          customerEmail: string,
        }
      }) => 
      axios.post("https://api.nomba.com/v1/checkout/order", { ...data, merchantTxRef: auth?.uid as string }, {
          headers: {
              "Content-Type": "application/json",
              "accountId": "5909f326-c021-4fa9-b1d4-f5e5e83936f3",
              "Authorization": `Bearer ${auth_response?.data.access_token}`,
          },
      }),
  });
};

export const useNombaRecurringPayment  = () => {
  // const apiClient = new ApiClient<any, {email: string, amount: number, plan: string}>("/v1/auth/token/issue");
  const { auth_response } = useNombaStore();
  return useMutation({
      mutationFn: (data: {
        order: {
          amount: number;
          callbackUrl: string,
          currency: string,
          customerEmail: string,
        }
      }) => 
      axios.post("https://api.nomba.com/v1/checkout/tokenized-card-payment", data, {
          headers: {
              "Content-Type": "application/json",
              "accountId": "5909f326-c021-4fa9-b1d4-f5e5e83936f3",
              "Authorization": `Bearer ${auth_response?.data.access_token}`,
          },
      }),
  });
};

export const useVerify = () => {
    // The `ApiClient` endpoint will be dynamic, as it depends on the `reference`

    return useMutation({

      mutationFn: async (reference: string) => {
        const apiClient = new ApiClient<any, never>(`/transaction/verify/${reference}`);
        return apiClient.get();
      },
      
    });
  };

export const useCreateSubscription = () => {
    const apiClient = new ApiClient<any, { customer: string; authorization: string; plan: string }>("/subscription");
    return useMutation({
        mutationFn: (data: { customer: string; authorization: string; plan: string }) => apiClient.post(data),
    });
};

export const useUnsubscribe = () => {
  const apiClient = new ApiClient<any, { code: string; token: string }>("/subscription/disable");
  return useMutation({
      mutationFn: (data: { code: string; token: string }) =>
          apiClient.post(data),
  });
};

export const useGetSubscriptionCodeAndEmailToken = () => {
  // The `ApiClient` endpoint will be dynamic, as it depends on the `reference`

  return useMutation({

    mutationFn: async (customer_id: string) => {
      const apiClient = new ApiClient<any, never>(`/subscription?customer=${customer_id}`);
      return apiClient.get();
    },
    
  });
};

export const useEnableSubscription = () => {
  const apiClient = new ApiClient<any, { code: string; token: string }>("/subscription/enable");
  return useMutation({
      mutationFn: (data: { code: string; token: string }) =>
          apiClient.post(data),
  });
};