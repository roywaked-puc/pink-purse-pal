import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AccountFeeType } from "@/types";

const mapRow = (row: any): AccountFeeType => ({
  id: row.id,
  accountId: row.account_id,
  label: row.label,
  feePercentage: Number(row.fee_percentage),
  orderIndex: row.order_index,
  createdAt: row.created_at,
});

export function useAccountFeeTypes(accountId?: string) {
  return useQuery({
    queryKey: ["account_fee_types", accountId ?? "all"],
    queryFn: async () => {
      let query = supabase.from("account_fee_types").select("*").order("order_index");
      if (accountId) query = query.eq("account_id", accountId);
      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []).map(mapRow);
    },
  });
}

export function useAddAccountFeeType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      accountId: string;
      label: string;
      feePercentage: number;
      orderIndex?: number;
    }) => {
      const { data: userData } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from("account_fee_types")
        .insert({
          user_id: userData.user?.id,
          account_id: input.accountId,
          label: input.label,
          fee_percentage: input.feePercentage,
          order_index: input.orderIndex ?? 0,
        })
        .select()
        .single();
      if (error) throw error;
      return mapRow(data);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["account_fee_types"] }),
  });
}

export function useUpdateAccountFeeType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      id: string;
      label?: string;
      feePercentage?: number;
      orderIndex?: number;
    }) => {
      const { id, ...rest } = input;
      const { error } = await supabase
        .from("account_fee_types")
        .update({
          ...(rest.label !== undefined && { label: rest.label }),
          ...(rest.feePercentage !== undefined && { fee_percentage: rest.feePercentage }),
          ...(rest.orderIndex !== undefined && { order_index: rest.orderIndex }),
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["account_fee_types"] }),
  });
}

export function useDeleteAccountFeeType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("account_fee_types").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["account_fee_types"] }),
  });
}

export function useCreateDefaultFeeTypes() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (accountId: string) => {
      const { data: userData } = await supabase.auth.getUser();
      const defaults = [
        { label: "Pix", order_index: 0 },
        { label: "Débito", order_index: 1 },
        { label: "Crédito", order_index: 2 },
      ];
      const { data, error } = await supabase
        .from("account_fee_types")
        .insert(
          defaults.map((d) => ({
            user_id: userData.user?.id,
            account_id: accountId,
            label: d.label,
            fee_percentage: 0,
            order_index: d.order_index,
          }))
        )
        .select();
      if (error) throw error;
      return (data ?? []).map(mapRow);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["account_fee_types"] }),
  });
}
