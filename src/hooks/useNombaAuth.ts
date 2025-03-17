/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMutation } from "@tanstack/react-query";
import axios from "axios";

export const useObtainNombaAccessToken  = () => {
    // const apiClient = new ApiClient<any, {email: string, amount: number, plan: string}>("/v1/auth/token/issue");
    return useMutation({
        mutationFn: (data: {grant_type: string, client_id: string, client_secret: string}) => 
        axios.post("https://api.nomba.com/v1/auth/token/issue", data, {
            headers: {
                "Content-Type": "application/json",
                "accountId": "5909f326-c021-4fa9-b1d4-f5e5e83936f3",
            },
        }),
    });
};