"use client";

import type { CustomerLoginDto, CustomerSession, CustomerSignupDto } from "@nodedr-restaurant/types";
import { useMutation, useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

interface CustomerSessionResponse {
  token: string;
  customer: CustomerSession;
}

/** Mirrors hooks/use-auth.ts's shape, for the guest's own login on the table-QR flow. */
export function useCustomerMe(qrToken: string, token: string | null) {
  return useQuery({
    queryKey: ["customer-auth", qrToken, token],
    queryFn: () =>
      api.get<CustomerSession>(`/public/menu/${qrToken}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
    enabled: !!token,
    retry: false,
  });
}

export function useCustomerSignup(qrToken: string) {
  return useMutation({
    mutationFn: (dto: CustomerSignupDto) =>
      api.post<CustomerSessionResponse>(`/public/menu/${qrToken}/auth/signup`, dto),
  });
}

export function useCustomerLogin(qrToken: string) {
  return useMutation({
    mutationFn: (dto: CustomerLoginDto) =>
      api.post<CustomerSessionResponse>(`/public/menu/${qrToken}/auth/login`, dto),
  });
}
