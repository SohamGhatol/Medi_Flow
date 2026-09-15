from app import create_app
from models import db
from models.medicine import Medicine, Company
from datetime import datetime, timedelta

def get_or_create_company(name, contact='', address=''):
    company = Company.query.filter_by(name=name).first()
    if not company:
        company = Company(name=name, contact=contact, address=address)
        db.session.add(company)
        db.session.commit()
    return company

def seed_catalog():
    """Seed the database with 50+ pharmacy medicines safely"""
    app = create_app()
    
    with app.app_context():
        # Define companies
        companies = {
            'Cipla': get_or_create_company('Cipla', 'contact@cipla.com'),
            'Sun Pharma': get_or_create_company('Sun Pharma', 'info@sunpharma.com'),
            'Dr. Reddys': get_or_create_company("Dr. Reddy's", 'support@drreddys.com'),
            'Lupin': get_or_create_company('Lupin', 'service@lupin.com'),
            'Aurobindo': get_or_create_company('Aurobindo Pharma', 'care@aurobindo.com'),
            'GSK': get_or_create_company('GlaxoSmithKline', 'care@gsk.com'),
            'Pfizer': get_or_create_company('Pfizer', 'contact@pfizer.com'),
            'Abbott': get_or_create_company('Abbott', 'info@abbott.com'),
            'J&J': get_or_create_company('Johnson & Johnson', 'support@jnj.com'),
            'Bayer': get_or_create_company('Bayer', 'contact@bayer.com')
        }

        # Categories
        # Pain Relief, Cold & Cough, Allergy & Sinus, Digestive Health, Vitamins & Supplements, Heart & Blood Pressure, Diabetes Care, Skin Care, First Aid, Oral Care
        
        medicines_data = [
            # Pain Relief
            {"name": "Acetaminophen Extra Strength", "generic": "Acetaminophen", "company": "J&J", "category": "Pain Relief", "type": "OTC", "price": 4.50, "qty": 300, "strength": "500mg", "form": "Tablet", "desc": "Extra strength pain reliever and fever reducer."},
            {"name": "Naproxen Sodium", "generic": "Naproxen", "company": "Bayer", "category": "Pain Relief", "type": "OTC", "price": 6.25, "qty": 250, "strength": "220mg", "form": "Tablet", "desc": "Long-lasting relief for muscle pain and inflammation."},
            {"name": "Aspirin Protect", "generic": "Aspirin", "company": "Bayer", "category": "Pain Relief", "type": "OTC", "price": 5.00, "qty": 400, "strength": "81mg", "form": "Tablet", "desc": "Low-dose aspirin for heart health and minor pain."},
            {"name": "Diclofenac Gel", "generic": "Diclofenac", "company": "GSK", "category": "Pain Relief", "type": "Rx", "price": 12.50, "qty": 150, "strength": "1%", "form": "Topical Gel", "desc": "Topical NSAID for arthritis and joint pain relief."},
            {"name": "Tramadol HCL", "generic": "Tramadol", "company": "Cipla", "category": "Pain Relief", "type": "Rx", "price": 15.00, "qty": 100, "strength": "50mg", "form": "Tablet", "desc": "Prescription pain relief for moderate to severe pain."},

            # Cold & Cough
            {"name": "Dextromethorphan Syrup", "generic": "Dextromethorphan", "company": "Pfizer", "category": "Cold & Cough", "type": "OTC", "price": 7.50, "qty": 200, "strength": "15mg/5mL", "form": "Syrup", "desc": "Cough suppressant for dry, hacking coughs."},
            {"name": "Guaifenesin Expectorant", "generic": "Guaifenesin", "company": "GSK", "category": "Cold & Cough", "type": "OTC", "price": 8.00, "qty": 250, "strength": "400mg", "form": "Tablet", "desc": "Helps loosen phlegm and thin bronchial secretions."},
            {"name": "Pseudoephedrine HCL", "generic": "Pseudoephedrine", "company": "Abbott", "category": "Cold & Cough", "type": "OTC", "price": 9.50, "qty": 180, "strength": "30mg", "form": "Tablet", "desc": "Nasal decongestant for sinus pressure and congestion."},
            {"name": "Cold & Flu Daytime", "generic": "Acetaminophen/Dextromethorphan", "company": "J&J", "category": "Cold & Cough", "type": "OTC", "price": 10.00, "qty": 300, "strength": "Multi", "form": "Liquid Gels", "desc": "Non-drowsy multi-symptom cold and flu relief."},
            {"name": "Benzonatate Perles", "generic": "Benzonatate", "company": "Lupin", "category": "Cold & Cough", "type": "Rx", "price": 14.00, "qty": 120, "strength": "100mg", "form": "Capsule", "desc": "Prescription non-narcotic cough medicine."},

            # Allergy & Sinus
            {"name": "Loratadine 10mg", "generic": "Loratadine", "company": "Bayer", "category": "Allergy & Sinus", "type": "OTC", "price": 12.00, "qty": 350, "strength": "10mg", "form": "Tablet", "desc": "24-hour non-drowsy allergy relief."},
            {"name": "Fexofenadine HCL", "generic": "Fexofenadine", "company": "Abbott", "category": "Allergy & Sinus", "type": "OTC", "price": 15.50, "qty": 280, "strength": "180mg", "form": "Tablet", "desc": "Indoor and outdoor allergy relief."},
            {"name": "Fluticasone Nasal Spray", "generic": "Fluticasone Propionate", "company": "GSK", "category": "Allergy & Sinus", "type": "OTC", "price": 18.00, "qty": 200, "strength": "50mcg", "form": "Nasal Spray", "desc": "24-hour relief from nasal congestion, sneezing, and runny nose."},
            {"name": "Diphenhydramine HCL", "generic": "Diphenhydramine", "company": "J&J", "category": "Allergy & Sinus", "type": "OTC", "price": 6.50, "qty": 400, "strength": "25mg", "form": "Capsule", "desc": "Fast-acting allergy relief. May cause drowsiness."},
            {"name": "Montelukast Sodium", "generic": "Montelukast", "company": "Cipla", "category": "Allergy & Sinus", "type": "Rx", "price": 22.00, "qty": 150, "strength": "10mg", "form": "Tablet", "desc": "Prescription medication for asthma and allergies."},

            # Digestive Health
            {"name": "Esomeprazole Magnesium", "generic": "Esomeprazole", "company": "Pfizer", "category": "Digestive Health", "type": "OTC", "price": 14.50, "qty": 220, "strength": "20mg", "form": "Capsule", "desc": "Treats frequent heartburn (acid reflux)."},
            {"name": "Loperamide HCL", "generic": "Loperamide", "company": "J&J", "category": "Digestive Health", "type": "OTC", "price": 5.75, "qty": 300, "strength": "2mg", "form": "Tablet", "desc": "Controls symptoms of diarrhea."},
            {"name": "Bismuth Subsalicylate", "generic": "Bismuth", "company": "Abbott", "category": "Digestive Health", "type": "OTC", "price": 8.50, "qty": 250, "strength": "262mg", "form": "Liquid", "desc": "Relieves upset stomach, heartburn, nausea, and diarrhea."},
            {"name": "Senna Laxative", "generic": "Sennosides", "company": "Sun Pharma", "category": "Digestive Health", "type": "OTC", "price": 6.00, "qty": 350, "strength": "8.6mg", "form": "Tablet", "desc": "Gentle, overnight relief from occasional constipation."},
            {"name": "Pantoprazole Sodium", "generic": "Pantoprazole", "company": "Dr. Reddys", "category": "Digestive Health", "type": "Rx", "price": 18.00, "qty": 180, "strength": "40mg", "form": "Tablet", "desc": "Prescription proton pump inhibitor for GERD."},

            # Vitamins & Supplements
            {"name": "Vitamin D3 1000 IU", "generic": "Cholecalciferol", "company": "Abbott", "category": "Vitamins & Supplements", "type": "OTC", "price": 9.00, "qty": 400, "strength": "1000 IU", "form": "Softgel", "desc": "Supports bone and immune health."},
            {"name": "B-Complex + C", "generic": "Vitamin B Complex", "company": "Pfizer", "category": "Vitamins & Supplements", "type": "OTC", "price": 12.50, "qty": 350, "strength": "Multi", "form": "Tablet", "desc": "Supports energy metabolism and nervous system health."},
            {"name": "Calcium Citrate", "generic": "Calcium", "company": "Bayer", "category": "Vitamins & Supplements", "type": "OTC", "price": 14.00, "qty": 250, "strength": "500mg", "form": "Tablet", "desc": "Highly absorbable calcium for strong bones."},
            {"name": "Iron Supplement", "generic": "Ferrous Sulfate", "company": "GSK", "category": "Vitamins & Supplements", "type": "OTC", "price": 7.50, "qty": 300, "strength": "325mg", "form": "Tablet", "desc": "Prevents and treats low blood iron levels."},
            {"name": "Omega-3 Fish Oil", "generic": "Fish Oil", "company": "Lupin", "category": "Vitamins & Supplements", "type": "OTC", "price": 18.50, "qty": 200, "strength": "1000mg", "form": "Softgel", "desc": "Supports heart, joint, and brain health."},

            # Heart & Blood Pressure
            {"name": "Amlodipine Besylate", "generic": "Amlodipine", "company": "Dr. Reddys", "category": "Heart & Blood Pressure", "type": "Rx", "price": 8.00, "qty": 250, "strength": "5mg", "form": "Tablet", "desc": "Calcium channel blocker used to treat high blood pressure."},
            {"name": "Losartan Potassium", "generic": "Losartan", "company": "Sun Pharma", "category": "Heart & Blood Pressure", "type": "Rx", "price": 10.50, "qty": 280, "strength": "50mg", "form": "Tablet", "desc": "Used to treat high blood pressure and protect kidneys in diabetes."},
            {"name": "Metoprolol Tartrate", "generic": "Metoprolol", "company": "Aurobindo", "category": "Heart & Blood Pressure", "type": "Rx", "price": 9.25, "qty": 220, "strength": "25mg", "form": "Tablet", "desc": "Beta blocker used to treat angina and high blood pressure."},
            {"name": "Clopidogrel", "generic": "Clopidogrel Bisulfate", "company": "Cipla", "category": "Heart & Blood Pressure", "type": "Rx", "price": 15.00, "qty": 180, "strength": "75mg", "form": "Tablet", "desc": "Blood thinner to prevent stroke and heart attack."},
            {"name": "Rosuvastatin", "generic": "Rosuvastatin Calcium", "company": "Lupin", "category": "Heart & Blood Pressure", "type": "Rx", "price": 24.00, "qty": 150, "strength": "10mg", "form": "Tablet", "desc": "Lowers 'bad' cholesterol and triglycerides in the blood."},

            # Diabetes Care
            {"name": "Glimepiride", "generic": "Glimepiride", "company": "Sun Pharma", "category": "Diabetes Care", "type": "Rx", "price": 6.50, "qty": 300, "strength": "2mg", "form": "Tablet", "desc": "Controls high blood sugar in people with type 2 diabetes."},
            {"name": "Sitagliptin", "generic": "Sitagliptin", "company": "Dr. Reddys", "category": "Diabetes Care", "type": "Rx", "price": 45.00, "qty": 120, "strength": "100mg", "form": "Tablet", "desc": "DPP-4 inhibitor used for type 2 diabetes management."},
            {"name": "Empagliflozin", "generic": "Empagliflozin", "company": "Cipla", "category": "Diabetes Care", "type": "Rx", "price": 52.00, "qty": 100, "strength": "10mg", "form": "Tablet", "desc": "Used along with diet and exercise to lower blood sugar in adults."},
            {"name": "Gliclazide MR", "generic": "Gliclazide", "company": "Aurobindo", "category": "Diabetes Care", "type": "Rx", "price": 12.00, "qty": 200, "strength": "30mg", "form": "Tablet", "desc": "Modified release tablet for type 2 diabetes."},

            # Skin Care
            {"name": "Hydrocortisone Cream 1%", "generic": "Hydrocortisone", "company": "Pfizer", "category": "Skin Care", "type": "OTC", "price": 6.75, "qty": 250, "strength": "1%", "form": "Cream", "desc": "Relieves itching, redness, and swelling from skin irritations."},
            {"name": "Clotrimazole Cream", "generic": "Clotrimazole", "company": "Bayer", "category": "Skin Care", "type": "OTC", "price": 8.50, "qty": 200, "strength": "1%", "form": "Cream", "desc": "Antifungal cream for athlete's foot, jock itch, and ringworm."},
            {"name": "Benzoyl Peroxide Wash", "generic": "Benzoyl Peroxide", "company": "J&J", "category": "Skin Care", "type": "OTC", "price": 12.00, "qty": 180, "strength": "5%", "form": "Face Wash", "desc": "Acne treatment that kills acne-causing bacteria."},
            {"name": "Mupirocin Ointment", "generic": "Mupirocin", "company": "GSK", "category": "Skin Care", "type": "Rx", "price": 18.50, "qty": 150, "strength": "2%", "form": "Ointment", "desc": "Prescription topical antibiotic for skin infections."},
            
            # First Aid
            {"name": "Povidone Iodine Ointment", "generic": "Povidone Iodine", "company": "Cipla", "category": "First Aid", "type": "OTC", "price": 5.00, "qty": 400, "strength": "10%", "form": "Ointment", "desc": "Antiseptic for minor cuts, scrapes, and burns."},
            {"name": "Hydrogen Peroxide", "generic": "Hydrogen Peroxide", "company": "Abbott", "category": "First Aid", "type": "OTC", "price": 3.50, "qty": 350, "strength": "3%", "form": "Liquid", "desc": "First aid antiseptic and oral debriding agent."},
            {"name": "Antibiotic Ointment", "generic": "Bacitracin/Polymyxin/Neomycin", "company": "J&J", "category": "First Aid", "type": "OTC", "price": 8.00, "qty": 300, "strength": "Multi", "form": "Ointment", "desc": "Triple antibiotic ointment to prevent infection in minor cuts."},
            
            # Oral Care
            {"name": "Chlorhexidine Mouthwash", "generic": "Chlorhexidine Gluconate", "company": "Dr. Reddys", "category": "Oral Care", "type": "Rx", "price": 14.00, "qty": 150, "strength": "0.12%", "form": "Mouthwash", "desc": "Prescription mouthwash to treat gingivitis."},
            {"name": "Benzocaine Oral Gel", "generic": "Benzocaine", "company": "GSK", "category": "Oral Care", "type": "OTC", "price": 7.50, "qty": 250, "strength": "20%", "form": "Gel", "desc": "Maximum strength oral pain reliever for toothaches and sore gums."}
        ]

        added_count = 0
        updated_count = 0

        for item in medicines_data:
            existing = Medicine.query.filter_by(name=item["name"]).first()
            if existing:
                # Update existing with new fields
                existing.category = item["category"]
                existing.generic_name = item["generic"]
                existing.dosage_form = item["form"]
                existing.strength = item["strength"]
                updated_count += 1
            else:
                # Add new medicine
                med = Medicine(
                    name=item["name"],
                    company_id=companies[item["company"]].company_id,
                    batch_no=f"BCH{datetime.now().strftime('%M%S')}{added_count}",
                    mfg_date=datetime.now().date() - timedelta(days=60),
                    exp_date=datetime.now().date() + timedelta(days=700),
                    quantity=item["qty"],
                    min_stock=20,
                    price=item["price"],
                    product_type=item["type"],
                    description=item["desc"],
                    category=item["category"],
                    generic_name=item["generic"],
                    dosage_form=item["form"],
                    strength=item["strength"]
                )
                db.session.add(med)
                added_count += 1

        # Also update the legacy 12 medicines to have categories if they don't
        legacy_updates = {
            'Paracetamol 500mg': {'cat': 'Pain Relief', 'gen': 'Paracetamol', 'form': 'Tablet', 'str': '500mg'},
            'Ibuprofen 400mg': {'cat': 'Pain Relief', 'gen': 'Ibuprofen', 'form': 'Tablet', 'str': '400mg'},
            'Cetirizine 10mg': {'cat': 'Allergy & Sinus', 'gen': 'Cetirizine', 'form': 'Tablet', 'str': '10mg'},
            'Vitamin C 1000mg': {'cat': 'Vitamins & Supplements', 'gen': 'Ascorbic Acid', 'form': 'Tablet', 'str': '1000mg'},
            'Antacid Tablets': {'cat': 'Digestive Health', 'gen': 'Calcium Carbonate', 'form': 'Tablet', 'str': 'Multi'},
            'Amoxicillin 500mg': {'cat': 'Antibiotics', 'gen': 'Amoxicillin', 'form': 'Capsule', 'str': '500mg'},
            'Metformin 500mg': {'cat': 'Diabetes Care', 'gen': 'Metformin', 'form': 'Tablet', 'str': '500mg'},
            'Atorvastatin 20mg': {'cat': 'Heart & Blood Pressure', 'gen': 'Atorvastatin', 'form': 'Tablet', 'str': '20mg'},
            'Lisinopril 10mg': {'cat': 'Heart & Blood Pressure', 'gen': 'Lisinopril', 'form': 'Tablet', 'str': '10mg'},
            'Omeprazole 20mg': {'cat': 'Digestive Health', 'gen': 'Omeprazole', 'form': 'Capsule', 'str': '20mg'},
            'Aspirin 75mg': {'cat': 'Heart & Blood Pressure', 'gen': 'Aspirin', 'form': 'Tablet', 'str': '75mg'},
            'Multivitamin Tablets': {'cat': 'Vitamins & Supplements', 'gen': 'Multivitamin', 'form': 'Tablet', 'str': 'Multi'}
        }
        
        for name, data in legacy_updates.items():
            leg = Medicine.query.filter_by(name=name).first()
            if leg:
                if leg.category == 'Uncategorized':
                    leg.category = data['cat']
                if not leg.generic_name:
                    leg.generic_name = data['gen']
                    leg.dosage_form = data['form']
                    leg.strength = data['str']
        
        db.session.commit()
        
        total = Medicine.query.count()
        print(f"One-Stop Pharmacy Seed Complete!")
        print(f"Added {added_count} new medicines.")
        print(f"Updated {updated_count} existing medicines.")
        print(f"Total catalog size: {total} medicines.")

if __name__ == '__main__':
    seed_catalog()
