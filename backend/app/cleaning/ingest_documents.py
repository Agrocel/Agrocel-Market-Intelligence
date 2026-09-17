import os, sys, hashlib, re, datetime, zipfile
import xml.etree.ElementTree as ET
from pathlib import Path
from typing import List, Dict, Any
from sqlalchemy.orm import Session
try:
    from pypdf import PdfReader
except ImportError:
    PdfReader = None

from ..database import SessionLocal
from ..models import SourceDocument, DocumentChunk, IntelligenceItem, IngestionRun
from ..vector.qdrant_store import get_qdrant_store
from .common import BASE_DIR, parse_flexible_date, get_or_create_product

RAW_REPORTS_DIR = BASE_DIR / "Data" / "Raw" / "RICHARD REPORT"
USER_DOCS_DIR = BASE_DIR / "Data" / "documents"

def clean_text_content(text: str) -> str:
    if not text:
        return ""
    # Replace weird whitespace and hyphenation
    t = re.sub(r'(\w+)-\s*\n\s*(\w+)', r'\1\2', text)
    t = re.sub(r'[ \t]+', ' ', t)
    t = re.sub(r'\n\s*\n+', '\n\n', t)
    return t.strip()

def chunk_text(text: str, chunk_size_chars: int = 2000, overlap_chars: int = 250) -> List[str]:
    text = clean_text_content(text)
    if not text:
        return []
    if len(text) <= chunk_size_chars:
        return [text]
        
    chunks = []
    start = 0
    while start < len(text):
        end = start + chunk_size_chars
        # Try to break at a sentence or newline boundary
        if end < len(text):
            boundary = max(text.rfind('. ', start, end), text.rfind('\n', start, end))
            if boundary > start + chunk_size_chars // 2:
                end = boundary + 1
        chunk = text[start:end].strip()
        if chunk:
            chunks.append(chunk)
        start = end - overlap_chars
    return chunks

def extract_pdf_pages(file_path: Path) -> List[Dict[str, Any]]:
    pages = []
    try:
        reader = PdfReader(str(file_path))
        for idx, page in enumerate(reader.pages):
            txt = page.extract_text() or ""
            pages.append({"page_number": idx + 1, "text": clean_text_content(txt)})
    except Exception as e:
        print(f"Error reading PDF {file_path.name}: {e}")
    return pages

def extract_docx_text(file_path: Path) -> List[Dict[str, Any]]:
    try:
        with zipfile.ZipFile(file_path) as z:
            xml_content = z.read('word/document.xml')
            tree = ET.fromstring(xml_content)
            paras = []
            for p in tree.iter('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}p'):
                texts = [node.text for node in p.iter('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}t') if node.text]
                if texts:
                    paras.append(''.join(texts))
            full_text = "\n\n".join(paras)
            return [{"page_number": 1, "text": clean_text_content(full_text)}]
    except Exception as e:
        print(f"Error reading DOCX {file_path.name}: {e}")
        return []

def extract_published_date(filename: str) -> datetime.date:
    d = parse_flexible_date(filename)
    if d:
        return d
    # Default to modern window if not found
    return datetime.date(2024, 6, 1)

def ingest_single_document(db: Session, file_path: Path, source_type: str = "RICHARD_REPORT") -> Dict[str, Any]:
    raw_bytes = file_path.read_bytes()
    checksum = hashlib.sha256(raw_bytes).hexdigest()
    
    # Check if already in MySQL
    doc = db.query(SourceDocument).filter(SourceDocument.checksum == checksum).first()
    if doc and doc.processing_status == "COMPLETED":
        return {"status": "duplicate", "document_id": doc.id, "chunks": 0}
        
    pub_date = extract_published_date(file_path.name)
    title = file_path.stem.replace('-', ' ').replace('_', ' ').title()
    
    if not doc:
        doc = SourceDocument(
            title=title,
            source_type=source_type,
            source_name="Richard Market Report" if "richard" in source_type.lower() else "Document Archive",
            file_path=str(file_path.relative_to(BASE_DIR)),
            published_at=pub_date,
            original_file_name=file_path.name,
            checksum=checksum,
            processing_status="PROCESSING"
        )
        db.add(doc)
        db.flush()
        
    # Extract pages
    if file_path.suffix.lower() == '.pdf':
        pages = extract_pdf_pages(file_path)
    elif file_path.suffix.lower() == '.docx':
        pages = extract_docx_text(file_path)
    else:
        pages = []
        
    all_chunks_data = []
    chunk_index = 0
    
    for p in pages:
        p_num = p["page_number"]
        c_list = chunk_text(p["text"])
        for ct in c_list:
            chunk_index += 1
            # Add to MySQL DocumentChunk
            dchunk = DocumentChunk(
                source_document_id=doc.id,
                chunk_text=ct,
                chunk_index=chunk_index,
                page_number=p_num
            )
            db.add(dchunk)
            
            all_chunks_data.append({
                "text": ct,
                "source_document_id": doc.id,
                "title": doc.title,
                "source_type": source_type,
                "page_number": p_num,
                "publication_date": pub_date.isoformat() if pub_date else None,
                "file_path": str(file_path.name),
                "reliability_grade": "B",
                "competitor": None,
                "geography": "Global"
            })
            
    db.commit()
    
    # Upsert to Qdrant
    qdrant = get_qdrant_store()
    vectors_indexed = qdrant.upsert_chunks(all_chunks_data)
    
    doc.processing_status = "COMPLETED"
    db.commit()
    
    return {"status": "indexed", "document_id": doc.id, "chunks": len(all_chunks_data)}

def ingest_all_reports(db: Session = None, max_docs: int = 60):
    close_db = False
    if db is None:
        db = SessionLocal()
        close_db = True
        
    print("\n--- Running ingest_documents Pipeline ---")
    
    run = IngestionRun(
        pipeline_name="ingest_documents",
        file_name="RICHARD REPORT/*.pdf, *.docx",
        started_at=datetime.datetime.utcnow(),
        status="RUNNING"
    )
    db.add(run)
    db.commit()
    
    target_files = []
    if RAW_REPORTS_DIR.exists():
        for f in sorted(RAW_REPORTS_DIR.iterdir()):
            if f.suffix.lower() in ('.pdf', '.docx'):
                target_files.append((f, "RICHARD_REPORT"))
                
    if USER_DOCS_DIR.exists():
        for f in sorted(USER_DOCS_DIR.iterdir()):
            if f.suffix.lower() in ('.pdf', '.docx', '.txt'):
                target_files.append((f, "USER_UPLOAD"))
                
    total_docs = len(target_files)
    indexed_docs = 0
    total_chunks = 0
    dupes = 0
    
    for fpath, stype in target_files[:max_docs]:
        res = ingest_single_document(db, fpath, source_type=stype)
        if res["status"] == "indexed":
            indexed_docs += 1
            total_chunks += res["chunks"]
        elif res["status"] == "duplicate":
            dupes += 1
            
    run.rows_processed = total_docs
    run.rows_loaded = indexed_docs
    run.rows_duplicate = dupes
    run.status = "SUCCESS"
    run.completed_at = datetime.datetime.utcnow()
    db.commit()
    
    print(f"  Document Ingestion Completed: {indexed_docs} documents newly indexed ({total_chunks} chunks), {dupes} duplicates.")
    
    if close_db:
        db.close()
        
    return {"indexed": indexed_docs, "chunks": total_chunks, "duplicates": dupes}

if __name__ == "__main__":
    ingest_all_reports()
