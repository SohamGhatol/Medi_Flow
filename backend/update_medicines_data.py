import os
from app import create_app
from models.medicine import Medicine, Company, db

app = create_app()

updates = {
    20: {"name": "Sudafed", "generic_name": "Pseudoephedrine HCl 30 mg", "company_name": "Wellcome", "strength": "30 mg"},
    22: {"name": "Benz Pearls", "generic_name": "Benzonatate 100 mg", "company_name": "Lupin", "strength": "100 mg"},
    24: {"name": "Allegra 120 mg", "generic_name": "Fexofenadine HCl 120 mg", "company_name": "Sanofi", "strength": "120 mg"},
    28: {"name": "Nexium 40 mg", "generic_name": "Esomeprazole 40 mg", "company_name": "AstraZeneca", "strength": "40 mg"},
    35: {"name": "Citracal Maximum Plus", "generic_name": "Calcium citrate + Vitamin D3", "company_name": "Bayer", "strength": "650 mg + 1000 IU"},
    36: {"name": "Macrafolin Iron", "generic_name": "Iron / Ferrous preparation", "company_name": "GlaxoSmithKline", "strength": ""},
    37: {"name": "Seacod Omega-3 Fish Oil", "generic_name": "Fish Oil 1000 mg", "company_name": "Sanofi", "strength": "1000 mg"}, # Kept it Sanofi since Seacod is from Sanofi
    39: {"name": "Losar 50 mg", "generic_name": "Losartan 50 mg", "company_name": "Torrent", "strength": "50 mg"},
    40: {"name": "Metoprolol Tartrate 50 mg", "generic_name": "Metoprolol tartrate 50 mg", "company_name": "Aurobindo Pharma", "strength": "50 mg"},
    42: {"name": "Rheza 10 mg", "generic_name": "Rosuvastatin 10 mg", "company_name": "Lupin", "strength": "10 mg"},
    43: {"name": "Amaryl 2 mg", "generic_name": "Glimepiride 2 mg", "company_name": "Sanofi", "strength": "2 mg"},
    44: {"name": "Sitagliptin 100 mg", "generic_name": "Sitagliptin 100 mg", "company_name": "Dr. Reddy's", "strength": "100 mg"},
    45: {"name": "Oboravo 10 mg", "generic_name": "Empagliflozin 10 mg", "company_name": "Cipla", "strength": "10 mg"},
    46: {"name": "Diamicron MR 60 mg", "generic_name": "Gliclazide 60 mg", "company_name": "Servier", "strength": "60 mg"},
    49: {"name": "Clean & Clear Continuous Control Acne Cleanser", "generic_name": "Benzoyl Peroxide 5%", "company_name": "Johnson & Johnson", "strength": "5%"},
    51: {"name": "Cipladine 5% Ointment", "generic_name": "Povidone Iodine 5% w/w", "company_name": "Cipla", "strength": "5%"},
    52: {"name": "Hydrogen Peroxide 3%", "generic_name": "Hydrogen Peroxide 3% v/v", "company_name": "Abbott", "strength": "3%"},
    53: {"name": "Neosporin Original Ointment", "generic_name": "Bacitracin Zinc + Neomycin + Polymyxin B", "company_name": "Johnson & Johnson", "strength": ""},
    54: {"name": "Clohex Mouthwash", "generic_name": "Chlorhexidine Gluconate 0.2% w/v", "company_name": "Dr. Reddy's", "strength": "0.2%"},
    55: {"name": "Anbesol Maximum Strength Gel", "generic_name": "Benzocaine 20%", "company_name": "GlaxoSmithKline", "strength": "20%"}
}

def get_or_create_company(name):
    comp = Company.query.filter_by(name=name).first()
    if not comp:
        comp = Company(name=name, contact="N/A", address="N/A")
        db.session.add(comp)
        db.session.commit()
    return comp

with app.app_context():
    for med_id, data in updates.items():
        med = Medicine.query.get(med_id)
        if med:
            comp = get_or_create_company(data['company_name'])
            med.name = data['name']
            med.generic_name = data['generic_name']
            med.company_id = comp.company_id
            med.strength = data['strength']
            print(f"Updated {med_id} -> {med.name}")
        else:
            print(f"Medicine {med_id} not found.")
    
    db.session.commit()
    print("Database updated successfully!")
