#!/usr/bin/env python3
"""
Extract first image from each blog article PDF using PyMuPDF (no poppler needed)
"""

import os
import sys
import re
from pathlib import Path

try:
    import fitz  # PyMuPDF
    from PIL import Image
    import io
except ImportError:
    print("❌ Missing dependencies. Installing...")
    os.system("pip3 install PyMuPDF pillow")
    import fitz
    from PIL import Image
    import io

# Configuration
PDF_FOLDER = Path("AI-IKIGAI Article de Blog")
OUTPUT_FOLDER = Path("blog/assets/images")
MAX_IMAGE_WIDTH = 1200
QUALITY = 85

# Article slug mapping
ARTICLE_SLUGS = {
    3: "ikigai-equilibre-4-cercles",
    4: "trouver-ikigai-exercices-pratiques",
    5: "ikigai-age-jamais-trop-tard",
    6: "ikigai-entreprise-engagement",
    7: "chat-gpt-ikigai-ia-orientation",
    8: "ikigai-okinawa-longevite",
    9: "test-ikigai-gratuit-guide",
    10: "ikigai-vs-purpose-flow-difference",
    11: "erreurs-eviter-ikigai",
    12: "ikigai-japonais-succes",
    13: "entrepreneuriat-aligne-ikigai",
    14: "micro-entreprise-ikigai-guide",
    15: "business-model-ikigai",
    16: "monetiser-passion-ikigai",
    17: "reconversion-40-ans-guide",
    18: "bilan-competences-reconversion",
    19: "financer-formation-reconversion",
    20: "temoignage-reconversion-reussie",
    21: "linkedin-ikigai-optimisation",
    22: "cv-ikigai-refonte",
    23: "networking-ikigai-reseau",
    24: "personal-branding-ikigai",
    25: "marie-prof-coach",
    26: "thomas-banquier-artisan",
    27: "sophie-comptable-dev",
    28: "pierre-manager-formateur",
    29: "ikigai-burnout-prevention",
    30: "ikigai-action-plan"
}

def extract_article_number(filename):
    """Extract article number from filename like 'Article_03_Title.pdf'"""
    # Try pattern: Article_XX_ or Article_X_
    match = re.search(r'Article[_\s]+(\d+)', filename, re.IGNORECASE)
    if match:
        return int(match.group(1))
    
    # Try pattern: XX_ or X_ at start
    match = re.search(r'^(\d+)[_\s]', filename)
    if match:
        return int(match.group(1))
    
    return None

def extract_first_page_as_image(pdf_path, output_filename):
    """Extract first page of PDF as PNG image"""
    try:
        print(f"🔄 Processing: {pdf_path.name}")
        
        # Open PDF
        doc = fitz.open(str(pdf_path))
        
        if len(doc) == 0:
            print(f"   ⚠️  PDF has no pages")
            return False
        
        # Get first page
        page = doc[0]
        
        # Render page to pixmap (image) at 150 DPI
        zoom = 150 / 72  # 72 is default DPI
        mat = fitz.Matrix(zoom, zoom)
        pix = page.get_pixmap(matrix=mat)
        
        # Convert to PIL Image
        img_data = pix.tobytes("png")
        img = Image.open(io.BytesIO(img_data))
        
        # Resize if too large
        if img.width > MAX_IMAGE_WIDTH:
            ratio = MAX_IMAGE_WIDTH / img.width
            new_height = int(img.height * ratio)
            img = img.resize((MAX_IMAGE_WIDTH, new_height), Image.Resampling.LANCZOS)
        
        # Save optimized PNG
        output_path = OUTPUT_FOLDER / output_filename
        img.save(output_path, "PNG", optimize=True)
        
        file_size_kb = output_path.stat().st_size / 1024
        print(f"   ✅ Saved: {output_filename} ({file_size_kb:.1f} KB)")
        
        doc.close()
        return True
        
    except Exception as e:
        print(f"   ❌ Error: {e}")
        return False

def main():
    """Main execution"""
    print("🚀 PDF Image Extraction Script (PyMuPDF)")
    print("=" * 60)
    
    # Create output folder
    OUTPUT_FOLDER.mkdir(parents=True, exist_ok=True)
    print(f"📂 Output folder: {OUTPUT_FOLDER}")
    print()
    
    # Find PDFs
    if not PDF_FOLDER.exists():
        print(f"❌ Folder not found: {PDF_FOLDER}")
        print(f"📁 Current directory: {Path.cwd()}")
        sys.exit(1)
    
    pdf_files = sorted(PDF_FOLDER.glob("*.pdf"))
    print(f"✅ Found {len(pdf_files)} PDF files\n")
    
    if not pdf_files:
        print("❌ No PDF files found!")
        sys.exit(1)
    
    # Process each PDF
    success_count = 0
    processed_articles = []
    
    for pdf_file in pdf_files:
        article_num = extract_article_number(pdf_file.stem)
        
        if article_num and article_num in ARTICLE_SLUGS:
            slug = ARTICLE_SLUGS[article_num]
            output_filename = f"article-{article_num}.png"
            
            if extract_first_page_as_image(pdf_file, output_filename):
                success_count += 1
                processed_articles.append(article_num)
        else:
            print(f"⚠️  Skipping {pdf_file.name} - article number: {article_num}")
    
    print()
    print("=" * 60)
    print(f"✅ Successfully extracted {success_count}/{len(pdf_files)} images")
    print(f"📁 Images saved to: {OUTPUT_FOLDER.absolute()}\n")
    
    if processed_articles:
        print("📋 Processed articles:", sorted(processed_articles))
        print()
        print("🔄 Next: Update imageMap in article-template-new.html")
        print("   Add these entries:")
        for num in sorted(processed_articles):
            slug = ARTICLE_SLUGS[num]
            print(f"   '{slug}': 'article-{num}.png',")

if __name__ == "__main__":
    main()
