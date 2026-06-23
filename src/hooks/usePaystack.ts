/* eslint-disable @typescript-eslint/no-explicit-any */
import ApiClient from "@/services/paystackApiClient";
import { useMutation } from "@tanstack/react-query";

export const useSubscribe = (sk: string) => {
    const apiClient = new ApiClient<any, {email: string, amount: number, plan: string, metadata: { userId: string }  }>("/transaction/initialize");
    return useMutation({
        mutationFn: (data: {email: string, amount: number, plan: string, metadata: {userId: string}}) => 
        apiClient.post(data, { Authorization: `Bearer ${sk}` }),
    });
};

export const useVerify = () => {
    return useMutation({
      mutationFn: async ({ reference, sk }: { reference: string; sk: string }) => {
        const apiClient = new ApiClient<any, never>(`/transaction/verify/${reference}`);
        return apiClient.get({ Authorization: `Bearer ${sk}` });
      },
    });
  };

// export const useCreateSubscription = () => {
//     const apiClient = new ApiClient<any, { customer: string; authorization: string; plan: string }>("/subscription");
//     return useMutation({
//         mutationFn: (data: { customer: string; authorization: string; plan: string }) => apiClient.post(data),
//     });
// };

export const useUnsubscribe = () => {
  const apiClient = new ApiClient<any, { code: string; token: string }>("/subscription/disable");
  return useMutation({
      mutationFn: ({ code, token, sk }: { code: string; token: string; sk: string }) =>
          apiClient.post({ code, token }, { Authorization: `Bearer ${sk}` }),
  });
};

export const useGetSubscriptionCodeAndEmailToken = () => {
  return useMutation({
      mutationFn: async ({ customer_id, sk }: { customer_id: string; sk: string }) => {
          const apiClient = new ApiClient<any, never>(`/subscription?customer=${customer_id}`);
          const response = await apiClient.get({ Authorization: `Bearer ${sk}` });
          // Log response to check structure
          console.log("API Response:", response);
          return response;
      },
  });
};

export const useGetCustomerInformation = () => {
  return useMutation({
      mutationFn: async ({ email_or_code, sk }: { email_or_code: string; sk: string }) => {
          const apiClient = new ApiClient<any, never>(`/customer/${email_or_code}`);
          const response = await apiClient.get({ Authorization: `Bearer ${sk}` });
          // Log response to check structure
          console.log("API Response:", response);
          return response;
      },
  });
};


// export const useEnableSubscription = (sk: string) => {
//   const apiClient = new ApiClient<any, { code: string; token: string }>("/subscription/enable");
//   return useMutation({
//       mutationFn: (data: { code: string; token: string }) =>
//           apiClient.post(data, { Authorization: `Bearer ${sk}` }),
//   });
// };

// export const useFetchSubscription = (sk: string) => {
//   return useMutation({
//     mutationFn: async (id_or_code: string) => {
//       const apiClient = new ApiClient<any, never>(`/subscription/${id_or_code}`);
//       return apiClient.get({ Authorization: `Bearer ${sk}` });
//     },
    
//   });
// };