import { z } from "zod";

const Alert = z
  .object({
    AlertCategory: z.string().nullable(),
    AlertDate: z.string().nullable(),
    AlertType: z.string().nullable(),
    EffectiveDate: z.string().nullable(),
    Note: z.string().nullable(),
    Owner: z.string().nullable(),
    Type: z.string().nullable(),
    SystemId: z.string().nullable(),
  })
  .transform((alert) => ({
    alertCategory: alert.AlertCategory,
    alertDate: alert.AlertDate,
    alertType: alert.AlertType,
    effectiveDate: alert.EffectiveDate,
    note: alert.Note,
    owner: alert.Owner,
    type: alert.Type,
    systemId: alert.SystemId,
  }));

const Alerts = z.array(Alert);

export type Alerts = z.infer<typeof Alerts>;

export type Alert = z.infer<typeof Alert>;

export function parseAlert(body: unknown): Alerts {
  const res = Alerts.safeParse(body);
  if (!res.success) {
    throw new Error("Invalid metadata info from server", { cause: res.error });
  }
  return res.data;
}
