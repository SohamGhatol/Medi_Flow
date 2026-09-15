from app import create_app
from models import db
from models.medicine import Medicine
from models.batch import MedicineBatch
from datetime import datetime, date

def migrate_to_batches():
    print("Starting batch migration...")
    app = create_app()
    with app.app_context():
        # First ensure tables exist
        db.create_all()
        
        medicines = Medicine.query.all()
        migrated_count = 0
        skipped_count = 0
        
        for medicine in medicines:
            # Check if this medicine already has batches (idempotency check)
            existing_batches = MedicineBatch.query.filter_by(medicine_id=medicine.medicine_id).count()
            if existing_batches > 0:
                print(f"Medicine {medicine.name} already has {existing_batches} batches. Skipping.")
                skipped_count += 1
                continue
                
            # If no batches and quantity > 0, create a legacy batch
            if medicine.quantity > 0:
                batch_no = medicine.batch_no
                if not batch_no:
                    batch_no = f"LEGACY-{medicine.medicine_id}"
                
                exp_date = medicine.exp_date
                status = 'ACTIVE'
                
                if not exp_date:
                    # Give it a safe old date and mark UNKNOWN
                    status = 'UNKNOWN_EXPIRY'
                    exp_date = date(2099, 12, 31) # Place in future so it doesn't expire immediately, but marked as unknown
                elif isinstance(exp_date, datetime):
                    exp_date = exp_date.date()
                
                if exp_date and exp_date < datetime.utcnow().date() and status != 'UNKNOWN_EXPIRY':
                    status = 'EXPIRED'
                
                mfg_date = medicine.mfg_date
                if isinstance(mfg_date, datetime):
                    mfg_date = mfg_date.date()
                
                new_batch = MedicineBatch(
                    medicine_id=medicine.medicine_id,
                    batch_no=batch_no,
                    mfg_date=mfg_date,
                    exp_date=exp_date,
                    quantity=medicine.quantity,
                    status=status
                )
                
                db.session.add(new_batch)
                migrated_count += 1
                print(f"Migrated {medicine.name}: {medicine.quantity} units to batch {batch_no}")
        
        try:
            db.session.commit()
            print(f"\nMigration complete!")
            print(f"Successfully migrated: {migrated_count} medicines.")
            print(f"Skipped (already migrated): {skipped_count} medicines.")
        except Exception as e:
            db.session.rollback()
            print(f"Failed to commit migration: {str(e)}")

if __name__ == "__main__":
    migrate_to_batches()
