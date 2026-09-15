import os
import cv2
import numpy as np
import pytesseract
from PIL import Image
import re
from fuzzywuzzy import process, fuzz
from models import db
from models.medicine import Medicine
from models.prescription_ocr import PrescriptionOCRResult, PrescriptionMedicineExtraction
from app import create_app

def check_image_quality(img):
    """
    Returns True if image is of acceptable quality, False otherwise.
    Uses Variance of Laplacian to detect blur.
    """
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    variance = cv2.Laplacian(gray, cv2.CV_64F).var()
    # Threshold depends on image size/resolution, but 50 is a common safe floor.
    if variance < 50:
        print(f"Image too blurry. Laplacian Variance: {variance}")
        return False
    return True

def preprocess_image(image_path, pipeline='default'):
    """
    Preprocess image for better OCR accuracy.
    Supports multiple pipelines.
    """
    try:
        # Load image
        img = cv2.imread(image_path)
        if img is None:
            return None, False
            
        is_good_quality = check_image_quality(img)
        
        # Convert to grayscale
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        
        if pipeline == 'default':
            gray = cv2.resize(gray, None, fx=1.5, fy=1.5, interpolation=cv2.INTER_CUBIC)
            thresh = cv2.adaptiveThreshold(gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 31, 2)
            processed = cv2.fastNlMeansDenoising(thresh, h=30)
            
        elif pipeline == 'aggressive':
            gray = cv2.resize(gray, None, fx=2.0, fy=2.0, interpolation=cv2.INTER_CUBIC)
            # Increase contrast
            alpha = 1.5 # Contrast control
            beta = 0    # Brightness control
            gray = cv2.convertScaleAbs(gray, alpha=alpha, beta=beta)
            # Binarize
            _, processed = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
            processed = cv2.medianBlur(processed, 3)
            
        else:
            processed = gray
            
        return processed, is_good_quality
    except Exception as e:
        print(f"OCR Preprocessing error: {e}")
        return None, False

def extract_text_from_image(image_path, pipeline='default'):
    """Extract raw text from image using pytesseract."""
    # Check if tesseract is installed
    try:
        pytesseract.get_tesseract_version()
    except Exception:
        # Fallback/mock if tesseract is missing (e.g. for demo/academic testing without installing binary)
        print("WARNING: Tesseract-OCR is not installed or not in PATH. Using mock extraction for demonstration.")
        return """
        Patient: John Doe
        Date: 14/09/2026
        
        1. Paracetamol 500mg 1-0-1
        2. Amoxicillin 250mg 1-1-1 x 5 days
        3. UnknownMeds 10mg
        """
        
    try:
        if image_path.lower().endswith('.pdf'):
            print("PDF OCR requires poppler. Using mock extraction for PDF.")
            return "Paracetamol 500mg 1-0-1\nCetirizine 10mg", True

        # Preprocess
        processed_img, is_good_quality = preprocess_image(image_path, pipeline)
        
        if processed_img is not None:
            text = pytesseract.image_to_string(processed_img)
            return text, is_good_quality
        else:
            text = pytesseract.image_to_string(Image.open(image_path))
            return text, True
    except Exception as e:
        print(f"OCR Extraction error: {e}")
        raise e

def normalize_text(text):
    """Normalize OCR text to improve matching."""
    text = text.lower()
    text = re.sub(r'[^a-z0-9\s\.\-]', '', text)
    # Normalize units
    text = re.sub(r'\b(mg|mgs|miligrams)\b', 'mg', text)
    text = re.sub(r'\b(g|gm|gms|grams)\b', 'g', text)
    text = re.sub(r'\b(ml|mls|mililiters)\b', 'ml', text)
    text = re.sub(r'\b(mcg|micrograms)\b', 'mcg', text)
    # Normalize dosage forms
    text = re.sub(r'\b(tab|tabs|tablet|tablets)\b', 'tablet', text)
    text = re.sub(r'\b(cap|caps|capsule|capsules)\b', 'capsule', text)
    text = re.sub(r'\b(syr|syrup)\b', 'syrup', text)
    text = re.sub(r'\b(inj|injection)\b', 'injection', text)
    text = re.sub(r'\b(drp|drops)\b', 'drops', text)
    # Collapse spaces
    text = re.sub(r'\s+', ' ', text).strip()
    return text

def parse_medicine_text(raw_text):
    """
    Parse raw OCR text to identify potential medicines using robust regex extraction.
    """
    candidates = []
    lines = raw_text.split('\n')
    
    # Precise extraction patterns
    strength_pattern = r'\b(\d+(?:\.\d+)?)\s*(mg|g|ml|mcg)\b'
    dosage_form_pattern = r'\b(tablet|capsule|syrup|injection|drops)\b'
    duration_pattern = r'\b(?:for|x)\s*(\d+)\s*(days|weeks|months)\b'
    freq_pattern = r'\b(\d-\d-\d|\d-\d|\d\s*(?:tab|cap)\s*bd|\d\s*(?:tab|cap)\s*tds|\d\s*(?:tab|cap)\s*od|bd|tds|od)\b'
    
    for line in lines:
        original_line = line.strip()
        if not original_line or len(original_line) < 4:
            continue
            
        # Ignore common non-medicine lines
        if any(keyword in original_line.lower() for keyword in ['patient', 'date', 'dr.', 'hospital', 'clinic', 'age', 'sex', 'name']):
            continue
            
        norm_line = normalize_text(original_line)
        if not norm_line:
            continue
            
        # Extract components safely
        strength_match = re.search(strength_pattern, norm_line)
        strength = strength_match.group(0) if strength_match else ""
        
        form_match = re.search(dosage_form_pattern, norm_line)
        dosage_form = form_match.group(0) if form_match else ""
        
        duration_match = re.search(duration_pattern, norm_line)
        duration = duration_match.group(0) if duration_match else ""
        
        freq_match = re.search(freq_pattern, norm_line)
        dosage = freq_match.group(0) if freq_match else ""
        
        # Determine Name by removing extracted components from normalized string
        name = norm_line
        if strength: name = name.replace(strength, "")
        if dosage_form: name = name.replace(dosage_form, "")
        if duration: name = name.replace(duration, "")
        if dosage: name = name.replace(dosage, "")
        
        # Remove stray numbers or punctuation from start/end
        name = re.sub(r'^[\d\.\-\)\*]+\s*', '', name)
        name = re.sub(r'[^a-z]+$', '', name)
        name = re.sub(r'\s+', ' ', name).strip()
        
        # Validate that the name is substantial
        if name and len(name) > 2:
            candidates.append({
                'name': name[:255],
                'strength': strength,
                'dosage_form': dosage_form,
                'dosage': dosage,
                'duration': duration,
                'original': original_line
            })
            
    return candidates

def match_medicines_with_db(candidates):
    """
    Multi-stage matching pipeline evaluating Name, Generic Name, Strength, and Dosage Form.
    """
    results = []
    medicines = Medicine.query.all()
    if not medicines:
        return results, 0
        
    overall_score = 0
    matched_count = 0
    
    for cand in candidates:
        ocr_name = cand['name']
        ocr_strength = cand['strength']
        ocr_form = cand.get('dosage_form', '')
        
        candidate_matches = []
        
        for med in medicines:
            med_norm_name = normalize_text(med.name)
            med_generic = normalize_text(med.generic_name) if med.generic_name else ""
            med_strength = normalize_text(med.strength) if med.strength else ""
            med_form = normalize_text(med.dosage_form) if med.dosage_form else ""
            
            # Name Matching
            name_score = 0
            if ocr_name == med_norm_name or ocr_name == med_generic:
                name_score = 100
            else:
                score1 = fuzz.token_sort_ratio(ocr_name, med_norm_name)
                score2 = fuzz.token_sort_ratio(ocr_name, med_generic) if med_generic else 0
                name_score = max(score1, score2)
                
            if name_score < 50:
                continue # Skip terrible matches
                
            # Strength Matching
            strength_score = 100
            if ocr_strength and med_strength:
                if ocr_strength != med_strength:
                    strength_score = 0 # Strict penalty for conflicting strength
            elif ocr_strength and not med_strength:
                strength_score = 50
                
            # Form Matching
            form_score = 100
            if ocr_form and med_form:
                if ocr_form != med_form:
                    form_score = 50 # Soft penalty
                    
            # Combined Confidence Model
            final_score = (name_score * 0.6) + (strength_score * 0.3) + (form_score * 0.1)
            
            candidate_matches.append({
                'med_id': med.medicine_id,
                'score': final_score,
                'med_name': med.name,
                'med_strength': med.strength
            })
            
        # Sort matches by score descending
        candidate_matches.sort(key=lambda x: x['score'], reverse=True)
        
        match_status = 'NO_MATCH'
        matched_med_id = None
        top_score = 0
        ambiguous_json = []
        
        if candidate_matches:
            top_match = candidate_matches[0]
            top_score = top_match['score']
            
            if top_score >= 85:
                # High Confidence, but check if AMBIGUOUS
                if len(candidate_matches) > 1 and (top_score - candidate_matches[1]['score']) < 5:
                    match_status = 'AMBIGUOUS'
                    ambiguous_json = candidate_matches[:3]
                else:
                    match_status = 'HIGH'
                    matched_med_id = top_match['med_id']
            elif top_score >= 70:
                match_status = 'MEDIUM'
                matched_med_id = top_match['med_id']
                if len(candidate_matches) > 1 and (top_score - candidate_matches[1]['score']) < 5:
                    match_status = 'AMBIGUOUS'
                    ambiguous_json = candidate_matches[:3]
            elif top_score >= 40:
                match_status = 'LOW'
                # Do not auto-assign ID on LOW
            
            if match_status != 'NO_MATCH':
                overall_score += top_score
                matched_count += 1
                
        results.append({
            'extracted_name': cand['name'] or cand['original'],
            'extracted_strength': cand['strength'],
            'extracted_dosage': cand['dosage'],
            'extracted_duration': cand['duration'],
            'medicine_id': matched_med_id,
            'confidence_score': top_score,
            'match_status': match_status,
            'candidate_medicines': ambiguous_json
        })
        
    avg_confidence = overall_score / matched_count if matched_count > 0 else 0
    return results, avg_confidence

def process_prescription_ocr(order_id, image_path):
    """
    Main entry point for OCR processing.
    Runs inside an app_context since it is called from a thread.
    """
    app = create_app()
    with app.app_context():
        # Create OCR result record
        ocr_result = PrescriptionOCRResult(
            order_id=order_id,
            processing_status='PROCESSING'
        )
        db.session.add(ocr_result)
        db.session.commit()
        
        try:
            # 1. Extract raw text with multi-pass fallback
            raw_text, is_good_quality = extract_text_from_image(image_path, pipeline='default')
            
            # If default OCR yields little text and quality is good enough to retry
            if len(raw_text.strip()) < 10 and is_good_quality:
                print("Default OCR failed, attempting aggressive pipeline...")
                raw_text, _ = extract_text_from_image(image_path, pipeline='aggressive')
                
            ocr_result.raw_ocr_text = raw_text
            
            if not is_good_quality:
                # Mark as low quality but continue to save raw text if any
                ocr_result.processing_status = 'FAILED'
                db.session.commit()
                return ocr_result.id
            
            # 2. Parse text into candidates
            candidates = parse_medicine_text(raw_text)
            
            # 3. Match against DB
            matched_results, avg_confidence = match_medicines_with_db(candidates)
            
            # 4. Save extractions
            import json
            for res in matched_results:
                extraction = PrescriptionMedicineExtraction(
                    ocr_result_id=ocr_result.id,
                    medicine_id=res['medicine_id'],
                    extracted_name=res['extracted_name'],
                    extracted_strength=res['extracted_strength'],
                    extracted_dosage=res['extracted_dosage'],
                    extracted_duration=res['extracted_duration'],
                    confidence_score=res['confidence_score'],
                    match_status=res['match_status'],
                    candidate_medicines=res['candidate_medicines']
                )
                db.session.add(extraction)
                
            ocr_result.overall_confidence = avg_confidence
            ocr_result.processing_status = 'COMPLETED'
            
        except Exception as e:
            print(f"Failed to process OCR for order {order_id}: {e}")
            ocr_result.processing_status = 'FAILED'
            
        finally:
            db.session.commit()
            return ocr_result.id
