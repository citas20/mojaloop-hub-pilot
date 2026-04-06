const CENTRAL_LEDGER = "http://central-ledger.kretxeucv.cv";
const CENTRAL_SETTLEMENT = "http://central-settlement.kretxeucv.cv";
const ACCOUNT_LOOKUP = "http://account-lookup-admin.kretxeucv.cv";

const headers = { "Content-Type": "application/json" };

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, { ...options, headers: { ...headers, ...options?.headers } });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`API Error ${res.status}: ${text || res.statusText}`);
  }
  if (res.status === 204) return {} as T;
  return res.json();
}

// Participants
export const getParticipants = () => request<any[]>(`${CENTRAL_LEDGER}/participants`);
export const getParticipant = (name: string) => request<any>(`${CENTRAL_LEDGER}/participants/${name}`);
export const createParticipant = (name: string, currency = "CVE") =>
  request<any>(`${CENTRAL_LEDGER}/participants`, {
    method: "POST",
    body: JSON.stringify({ name, currency }),
  });
export const updateParticipant = (name: string, isActive: boolean) =>
  request<any>(`${CENTRAL_LEDGER}/participants/${name}`, {
    method: "PUT",
    body: JSON.stringify({ isActive }),
  });
export const getParticipantLimits = (name: string) =>
  request<any[]>(`${CENTRAL_LEDGER}/participants/${name}/limits`);
export const updateParticipantLimits = (name: string, value: number, currency = "CVE") =>
  request<any>(`${CENTRAL_LEDGER}/participants/${name}/limits`, {
    method: "PUT",
    body: JSON.stringify({ currency, limit: { type: "NET_DEBIT_CAP", value } }),
  });
export const getParticipantPositions = (name: string) =>
  request<any[]>(`${CENTRAL_LEDGER}/participants/${name}/positions`);
export const getParticipantAccounts = (name: string) =>
  request<any[]>(`${CENTRAL_LEDGER}/participants/${name}/accounts`);

// Endpoints
export const getParticipantEndpoints = (name: string) =>
  request<any[]>(`${CENTRAL_LEDGER}/participants/${name}/endpoints`);
export const createParticipantEndpoint = (name: string, type: string, value: string) =>
  request<any>(`${CENTRAL_LEDGER}/participants/${name}/endpoints`, {
    method: "POST",
    body: JSON.stringify({ type, value }),
  });

// Funds
export const recordFunds = (
  name: string,
  accountId: string | number,
  body: {
    transferId: string;
    externalReference: string;
    action: string;
    reason: string;
    amount: { amount: number; currency: string };
  }
) =>
  request<any>(`${CENTRAL_LEDGER}/participants/${name}/accounts/${accountId}`, {
    method: "POST",
    body: JSON.stringify(body),
  });

// Onboarding
export const setInitialPositionAndLimits = (
  name: string,
  currency: string,
  ndcValue: number,
  initialPosition = 0
) =>
  request<any>(`${CENTRAL_LEDGER}/participants/${name}/initialPositionAndLimits`, {
    method: "POST",
    body: JSON.stringify({
      currency,
      limit: { type: "NET_DEBIT_CAP", value: ndcValue },
      initialPosition,
    }),
  });

// Transfers
export const getTransaction = (transferId: string) =>
  request<any>(`${CENTRAL_LEDGER}/transactions/${transferId}`);

// Settlement
export const getSettlementModels = () =>
  request<any[]>(`${CENTRAL_LEDGER}/settlementModels`);
export const getSettlementWindows = (state = "OPEN") =>
  request<any[]>(`${CENTRAL_SETTLEMENT}/v2/settlementWindows?state=${state}`);
export const closeSettlementWindow = (id: string | number, reason: string) =>
  request<any>(`${CENTRAL_SETTLEMENT}/v2/settlementWindows/${id}`, {
    method: "POST",
    body: JSON.stringify({ state: "CLOSED", reason }),
  });
