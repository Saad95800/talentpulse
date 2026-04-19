import { extractTextFromFile } from '../document';
import * as mammoth from 'mammoth';
import { PDFParse } from 'pdf-parse';

// Mocks simples pour les dépendances lourdes
jest.mock('pdf-parse', () => {
  const MockPDFParse = jest.fn().mockImplementation(() => ({
    getText: jest.fn().mockResolvedValue({ text: "Contenu PDF Simulé" })
  }));
  // @ts-expect-error - setWorker exists on the actual lib but might be missing in type definitions used by Jest
  MockPDFParse.setWorker = jest.fn();
  return { PDFParse: MockPDFParse };
});

jest.mock('mammoth', () => ({
  extractRawText: jest.fn().mockResolvedValue({ value: "Contenu DOCX Simulé" })
}));

describe('Document Extraction Logic', () => {
  
  it('should extract text from a TXT file buffer', async () => {
    const buffer = Buffer.from("Hello TalentPulse");
    const result = await extractTextFromFile(buffer, "test.txt");
    
    expect(result.text).toBe("Hello TalentPulse");
    expect(result.isScanned).toBe(false);
  });

  it('should handle DOCX files using mammoth', async () => {
    const buffer = Buffer.from("fake-docx-content");
    const result = await extractTextFromFile(buffer, "document.docx");
    
    expect(result.text).toBe("Contenu DOCX Simulé");
    expect(mammoth.extractRawText).toHaveBeenCalled();
  });

  it('should detect image-only error messages in PDFs', async () => {
    const MockedPDFParse = PDFParse as unknown as jest.Mock;
    MockedPDFParse.mockImplementation(() => ({
      getText: jest.fn().mockResolvedValue({ text: "This document is in image-only format." })
    }));

    const buffer = Buffer.from("fake-pdf-content");
    const result = await extractTextFromFile(buffer, "scanned.pdf");
    
    expect(result.isScanned).toBe(true);
  });

  it('should detect short documents as potential scans', async () => {
    const MockedPDFParse = PDFParse as unknown as jest.Mock;
    MockedPDFParse.mockImplementation(() => ({
      getText: jest.fn().mockResolvedValue({ text: "Ceci est très court." })
    }));

    const buffer = Buffer.from("fake-pdf-content");
    const result = await extractTextFromFile(buffer, "short.pdf");
    
    expect(result.isScanned).toBe(true);
  });

  it('should truncate documents longer than 50k characters', async () => {
    const longText = "A".repeat(60000);
    const buffer = Buffer.from(longText);
    const result = await extractTextFromFile(buffer, "verylong.txt");
    
    expect(result.text.length).toBeLessThan(51000);
    expect(result.text).toContain("[Document Tronqué]");
  });

  it('should throw error for unsupported extensions', async () => {
    const buffer = Buffer.from("data");
    await expect(extractTextFromFile(buffer, "virus.exe")).rejects.toThrow("Format de fichier non supporté");
  });
});
