// P9: Duplicate Detection & OCR Caching with SHA256
import { createHash } from "crypto";

export interface DuplicateCheckResult {
  is_duplicate: boolean;
  existing_invoice_id?: string;
  confidence: number;
  matched_on: string[];
}

/**
 * Generate SHA256 hash for invoice uniqueness
 */
export function generateInvoiceHash(
  vendorId: string,
  invoiceNumber: string,
  date: string,
  amount: number,
  poNumber?: string
): string {
  const data = `${vendorId}|${invoiceNumber}|${date}|${amount}|${poNumber || ""}`;
  return createHash("sha256").update(data).digest("hex");
}

/**
 * P9: Streaming gate for OCR caching
 * Prevents multiple OCR operations on the same document
 */
export class OCRStreamGate {
  private processingFiles: Map<string, Promise<any>> = new Map();
  private cache: Map<string, any> = new Map();

  /**
   * Process file with automatic caching and de-duplication
   */
  async process<T>(
    fileHash: string,
    processor: () => Promise<T>,
    cacheTTL: number = 3600000 // 1 hour default
  ): Promise<T> {
    // Check cache first
    const cached = this.cache.get(fileHash);
    if (cached && cached.expiry > Date.now()) {
      console.log(`OCR cache hit for ${fileHash}`);
      return cached.data;
    }

    // Check if already processing
    if (this.processingFiles.has(fileHash)) {
      console.log(`OCR already processing ${fileHash}, waiting...`);
      return this.processingFiles.get(fileHash)!;
    }

    // Start processing
    const promise = processor()
      .then((result) => {
        // Cache result
        this.cache.set(fileHash, {
          data: result,
          expiry: Date.now() + cacheTTL,
        });
        this.processingFiles.delete(fileHash);
        return result;
      })
      .catch((err) => {
        this.processingFiles.delete(fileHash);
        throw err;
      });

    this.processingFiles.set(fileHash, promise);
    return promise;
  }

  /**
   * Clear expired cache entries
   */
  cleanCache(): void {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (value.expiry <= now) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return {
      cached_items: this.cache.size,
      processing_items: this.processingFiles.size,
    };
  }
}

export const ocrGate = new OCRStreamGate();

/**
 * Generate file hash for OCR caching
 */
export async function generateFileHash(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Fuzzy matching for duplicate detection
 */
export function fuzzyMatch(str1: string, str2: string): number {
  const s1 = str1.toLowerCase().replace(/\s+/g, "");
  const s2 = str2.toLowerCase().replace(/\s+/g, "");

  if (s1 === s2) return 1.0;

  // Levenshtein distance
  const matrix: number[][] = [];
  for (let i = 0; i <= s1.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= s2.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= s1.length; i++) {
    for (let j = 1; j <= s2.length; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }

  const maxLen = Math.max(s1.length, s2.length);
  return 1 - matrix[s1.length][s2.length] / maxLen;
}
