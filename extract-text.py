#!/usr/bin/env python3
import fitz  # PyMuPDF
import sys
import os

pdf_file = sys.argv[1]
pdf = fitz.open(pdf_file)

text = ""
for page_num in range(min(10, len(pdf))):  # First 10 pages
    page = pdf[page_num]
    text += page.get_text()

# Print first 8000 characters
print(text[:8000])
pdf.close()
