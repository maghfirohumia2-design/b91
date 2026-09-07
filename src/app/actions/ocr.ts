"use server";

import { buildReceiptPrompt, ReceiptScanResult } from "@/lib/gemini";

interface ScanReceiptParams {
  base64Image: string;
  mimeType: string;
  availableCategories: string[];
  customApiKey?: string;
}

interface ScanReceiptResponse {
  success: boolean;
  data?: ReceiptScanResult;
  error?: string;
}

export async function scanReceiptAction({
  base64Image,
  mimeType,
  availableCategories,
  customApiKey,
}: ScanReceiptParams): Promise<ScanReceiptResponse> {
  try {
    const apiKey =
      customApiKey?.trim() ||
      process.env.GEMINI_API_KEY?.trim() ||
      process.env.NEXT_PUBLIC_GEMINI_API_KEY?.trim() ||
      "";

    if (!apiKey) {
      return {
        success: false,
        error:
          "Kunci Gemini API belum diatur. Silakan masukkan Gemini API Key di menu Pengaturan AI pada halaman Profil atau konfigurasikan GEMINI_API_KEY di environment.",
      };
    }

    // Bersihkan prefix data URL jika ada (e.g. data:image/jpeg;base64,...)
    const cleanBase64 = base64Image.includes(",")
      ? base64Image.split(",")[1]
      : base64Image;

    const promptText = buildReceiptPrompt(availableCategories);

    const requestBody = {
      contents: [
        {
          parts: [
            {
              text: promptText,
            },
            {
              inlineData: {
                mimeType: mimeType || "image/jpeg",
                data: cleanBase64,
              },
            },
          ],
        },
      ],
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.1,
      },
    };

    // Daftar model aktif Google AI Studio
    const models = [
      "gemini-1.5-flash",
      "gemini-2.0-flash",
      "gemini-1.5-flash-8b",
      "gemini-1.5-pro",
      "gemini-pro"
    ];
    let rawResponseText = "";
    let lastError = "";

    for (const model of models) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        });

        if (response.ok) {
          const resultJson = await response.json();
          const candidateText =
            resultJson?.candidates?.[0]?.content?.parts?.[0]?.text || "";
          if (candidateText) {
            rawResponseText = candidateText;
            break;
          }
        } else {
          const errData = await response.json().catch(() => ({}));
          lastError = errData?.error?.message || `HTTP ${response.status}`;
        }
      } catch (err: unknown) {
        lastError = err instanceof Error ? err.message : "Gagal memanggil API";
      }
    }

    if (!rawResponseText) {
      return {
        success: false,
        error: `Gagal memproses gambar dengan Gemini AI: ${lastError}`,
      };
    }

    // Parse output JSON
    let parsed: ReceiptScanResult;
    try {
      // Bersihkan jika ada bungkus markdown codeblock
      let jsonString = rawResponseText.trim();
      if (jsonString.startsWith("```json")) {
        jsonString = jsonString.replace(/^```json/, "").replace(/```$/, "").trim();
      } else if (jsonString.startsWith("```")) {
        jsonString = jsonString.replace(/^```/, "").replace(/```$/, "").trim();
      }

      const rawParsed = JSON.parse(jsonString);

      // Normalisasi tipe data
      parsed = {
        amount: typeof rawParsed.amount === "number" ? Math.round(rawParsed.amount) : parseInt(String(rawParsed.amount || "0").replace(/\D/g, ""), 10) || 0,
        merchant: String(rawParsed.merchant || "Toko / Merchant").trim(),
        date: rawParsed.date || undefined,
        suggestedCategory: rawParsed.suggestedCategory || undefined,
        description: String(rawParsed.description || "").trim(),
        items: Array.isArray(rawParsed.items) ? rawParsed.items.map(String) : [],
        rawText: rawResponseText,
      };
    } catch {
      return {
        success: false,
        error: "AI berhasil memindai struk tetapi format data tidak dapat dibaca.",
      };
    }

    return {
      success: true,
      data: parsed,
    };
  } catch (e: unknown) {
    const errorMsg = e instanceof Error ? e.message : "Terjadi kesalahan sistem saat memindai struk.";
    console.error("scanReceiptAction exception:", e);
    return {
      success: false,
      error: errorMsg,
    };
  }
}

/**
 * Server Action untuk menguji validitas API Key Gemini tanpa kendala CORS browser
 */
export async function testGeminiApiKeyAction(apiKey: string): Promise<{ success: boolean; message: string }> {
  const cleanKey = apiKey.trim();
  if (!cleanKey) {
    return { success: false, message: "Kunci API tidak boleh kosong." };
  }

  const candidateModels = [
    "gemini-1.5-flash",
    "gemini-2.0-flash",
    "gemini-1.5-flash-8b",
    "gemini-1.5-pro",
    "gemini-pro"
  ];

  let lastErrorMsg = "";

  for (const model of candidateModels) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${cleanKey}`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: "Halo! Jawab dengan 1 kata: OK" }] }],
        }),
      });

      if (res.ok) {
        return {
          success: true,
          message: `Koneksi ke Google Gemini AI (${model}) Berhasil! Fitur scan struk siap digunakan.`,
        };
      } else {
        const err = await res.json().catch(() => ({}));
        lastErrorMsg = err?.error?.message || `HTTP ${res.status}`;
      }
    } catch (err: unknown) {
      lastErrorMsg = err instanceof Error ? err.message : "Kesalahan server";
    }
  }

  return {
    success: false,
    message: `Gagal menghubungkan ke AI: ${lastErrorMsg}. Pastikan API Key valid dari Google AI Studio.`,
  };
}
