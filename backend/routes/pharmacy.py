from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from models import Medicine, User
from schemas import MedicineResponse, MedicineCreate, MedicineUpdate
from .auth import get_current_user

router = APIRouter(prefix="/pharmacy", tags=["pharmacy"])

@router.get("/", response_model=List[MedicineResponse])
def get_all_medicines(db: Session = Depends(get_db)):
    medicines = db.query(Medicine).all()
    return medicines

@router.get("/low-stock", response_model=List[MedicineResponse])
def get_low_stock_medicines(db: Session = Depends(get_db)):
    medicines = db.query(Medicine).filter(
        Medicine.stock_quantity <= Medicine.minimum_stock_alert
    ).all()
    return medicines

@router.get("/outbreak-demand", response_model=List[MedicineResponse])
def get_outbreak_demand_medicines(db: Session = Depends(get_db)):
    medicines = db.query(Medicine).filter(Medicine.outbreak_demand_flag == True).all()
    return medicines

@router.get("/category/{category}", response_model=List[MedicineResponse])
def get_medicines_by_category(category: str, db: Session = Depends(get_db)):
    medicines = db.query(Medicine).filter(
        Medicine.category.ilike(f"%{category}%")
    ).all()
    return medicines

@router.get("/{medicine_id}", response_model=MedicineResponse)
def get_medicine(medicine_id: int, db: Session = Depends(get_db)):
    medicine = db.query(Medicine).filter(Medicine.id == medicine_id).first()
    if not medicine:
        raise HTTPException(status_code=404, detail="Medicine not found")
    return medicine

@router.post("/", response_model=MedicineResponse)
def create_medicine(
    medicine: MedicineCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in ["admin"]:
        raise HTTPException(status_code=403, detail="Not authorized to create medicines")
    
    db_medicine = Medicine(**medicine.dict())
    db.add(db_medicine)
    db.commit()
    db.refresh(db_medicine)
    return db_medicine

@router.put("/{medicine_id}", response_model=MedicineResponse)
def update_medicine(
    medicine_id: int,
    medicine_update: MedicineUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in ["admin"]:
        raise HTTPException(status_code=403, detail="Not authorized to update medicines")
    
    medicine = db.query(Medicine).filter(Medicine.id == medicine_id).first()
    if not medicine:
        raise HTTPException(status_code=404, detail="Medicine not found")
    
    update_data = medicine_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(medicine, field, value)
    
    db.commit()
    db.refresh(medicine)
    return medicine

@router.delete("/{medicine_id}")
def delete_medicine(
    medicine_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in ["admin"]:
        raise HTTPException(status_code=403, detail="Not authorized to delete medicines")
    
    medicine = db.query(Medicine).filter(Medicine.id == medicine_id).first()
    if not medicine:
        raise HTTPException(status_code=404, detail="Medicine not found")
    
    db.delete(medicine)
    db.commit()
    return {"message": "Medicine deleted successfully"}

@router.put("/{medicine_id}/stock")
def update_stock(
    medicine_id: int,
    quantity_change: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in ["admin"]:
        raise HTTPException(status_code=403, detail="Not authorized to update stock")
    
    medicine = db.query(Medicine).filter(Medicine.id == medicine_id).first()
    if not medicine:
        raise HTTPException(status_code=404, detail="Medicine not found")
    
    new_quantity = medicine.stock_quantity + quantity_change
    if new_quantity < 0:
        raise HTTPException(status_code=400, detail="Stock cannot be negative")
    
    medicine.stock_quantity = new_quantity
    db.commit()
    
    return {"message": f"Stock updated. New quantity: {new_quantity}"}

@router.post("/outbreak-alert/{medicine_id}")
def toggle_outbreak_alert(
    medicine_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in ["admin", "gov_official"]:
        raise HTTPException(status_code=403, detail="Not authorized to manage outbreak alerts")
    
    medicine = db.query(Medicine).filter(Medicine.id == medicine_id).first()
    if not medicine:
        raise HTTPException(status_code=404, detail="Medicine not found")
    
    medicine.outbreak_demand_flag = not medicine.outbreak_demand_flag
    db.commit()
    
    return {"message": f"Outbreak demand flag updated to {medicine.outbreak_demand_flag}"}

@router.get("/analytics/inventory")
def get_inventory_analytics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in ["admin", "gov_official"]:
        raise HTTPException(status_code=403, detail="Not authorized to view analytics")
    
    from sqlalchemy import func
    
    # Stock status summary
    total_medicines = db.query(func.count(Medicine.id)).scalar()
    low_stock_count = db.query(func.count(Medicine.id)).filter(
        Medicine.stock_quantity <= Medicine.minimum_stock_alert
    ).scalar()
    out_of_stock_count = db.query(func.count(Medicine.id)).filter(
        Medicine.stock_quantity == 0
    ).scalar()
    outbreak_flagged_count = db.query(func.count(Medicine.id)).filter(
        Medicine.outbreak_demand_flag == True
    ).scalar()
    
    # Category-wise stock
    category_stock = db.query(
        Medicine.category,
        func.sum(Medicine.stock_quantity).label("total_stock"),
        func.count(Medicine.id).label("medicine_count")
    ).group_by(Medicine.category).all()
    
    # Most critical medicines (low stock + high demand)
    critical_medicines = db.query(Medicine).filter(
        Medicine.stock_quantity <= Medicine.minimum_stock_alert,
        Medicine.outbreak_demand_flag == True
    ).all()
    
    return {
        "summary": {
            "total_medicines": total_medicines,
            "low_stock_count": low_stock_count,
            "out_of_stock_count": out_of_stock_count,
            "outbreak_flagged_count": outbreak_flagged_count
        },
        "category_stock": [
            {
                "category": cat[0] if cat[0] else "Uncategorized",
                "total_stock": cat[1] or 0,
                "medicine_count": cat[2]
            } for cat in category_stock
        ],
        "critical_medicines": [
            {
                "id": med.id,
                "name": med.name,
                "stock_quantity": med.stock_quantity,
                "minimum_alert": med.minimum_stock_alert
            } for med in critical_medicines
        ]
    }
