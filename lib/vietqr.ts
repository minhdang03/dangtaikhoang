export interface VietQRParams {
  bankBin: string;
  accountNo: string;
  accountName: string;
  amount: number;
  description: string;
}

export async function generateVietQR(params: VietQRParams): Promise<string | null> {
  try {
    const res = await fetch("https://api.vietqr.io/v2/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-client-id": "your-client-id",
        "x-api-key": "your-api-key",
      },
      body: JSON.stringify({
        accountNo: params.accountNo,
        accountName: params.accountName,
        acqId: params.bankBin,
        amount: params.amount,
        addInfo: params.description,
        format: "compact2",
        template: "compact2",
      }),
    });
    const data = await res.json();
    if (data.code === "00") {
      return data.data.qrDataURL;
    }
    return null;
  } catch {
    return null;
  }
}

// Generate a VietQR URL using the free img.vietqr.io endpoint (no API key needed)
export function generateVietQRUrl(params: VietQRParams): string {
  const { bankBin, accountNo, amount, description, accountName } = params;
  // Format: https://img.vietqr.io/image/{bank}-{account}-compact2.jpg?amount={amount}&addInfo={info}&accountName={name}
  const encodedDesc = encodeURIComponent(description);
  const encodedName = encodeURIComponent(accountName);
  return `https://img.vietqr.io/image/${bankBin}-${accountNo}-compact2.jpg?amount=${amount}&addInfo=${encodedDesc}&accountName=${encodedName}`;
}

export const BANKS = [
  { id: "MB", bin: "970422", name: "MB Bank" },
  { id: "VCB", bin: "970436", name: "Vietcombank" },
  { id: "TCB", bin: "970407", name: "Techcombank" },
  { id: "BIDV", bin: "970418", name: "BIDV" },
  { id: "VTB", bin: "970415", name: "VietinBank" },
  { id: "ACB", bin: "970416", name: "ACB" },
  { id: "VPB", bin: "970432", name: "VPBank" },
  { id: "TPB", bin: "970423", name: "TPBank" },
  { id: "STB", bin: "970403", name: "Sacombank" },
  { id: "MSB", bin: "970426", name: "MSB" },
  { id: "SHB", bin: "970443", name: "SHB" },
  { id: "HDB", bin: "970437", name: "HDBank" },
  { id: "OCB", bin: "970448", name: "OCB" },
  { id: "SEAB", bin: "970440", name: "SeABank" },
  { id: "MBV", bin: "970422", name: "MBBank" },
];
