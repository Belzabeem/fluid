import prisma from "../utils/db";

type TerminalStatus = "success" | "failed";

export class WebhookService {
  async dispatch(tenantId: string, hash: string, status: TerminalStatus): Promise<void> {
    try {
      const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });

      if (!tenant) {
        console.warn(`[WebhookService] Tenant not found for tenantId=${tenantId}, hash=${hash}. Skipping dispatch.`);
        return;
      }

      if (!tenant.webhookUrl) {
        console.debug(`[WebhookService] No webhookUrl for tenantId=${tenantId}, hash=${hash}. Skipping dispatch.`);
        return;
      }

      const payload = { hash, status };

      let response: Response;
      try {
        response = await fetch(tenant.webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } catch (networkError) {
        console.error(`[WebhookService] Network error dispatching webhook for hash=${hash}: ${networkError}`);
        return;
      }

      if (response.ok) {
        console.log(`[WebhookService] Webhook delivered successfully for hash=${hash}, status=${status}`);
      } else {
        console.error(
          `[WebhookService] Webhook returned non-2xx response for hash=${hash}: HTTP ${response.status}`
        );
      }
    } catch (error) {
      console.error(`[WebhookService] Unexpected error during dispatch for hash=${hash}: ${error}`);
    }
  }
}

export const webhookService = new WebhookService();
