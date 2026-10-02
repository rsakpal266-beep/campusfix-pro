"""Common and reference data routes (Categories, Locations, Inventory) for CampusFix Pro."""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db
from models import Category, Location, InventoryItem

router = APIRouter(prefix="/api", tags=["Common"])


@router.get("/categories")
def get_categories(db: Session = Depends(get_db)):
    cats = db.query(Category).filter(Category.is_active == True).order_by(Category.id).all()
    return {
        "status": "success",
        "categories": [
            {
                "id": c.id,
                "name": c.name,
                "description": c.description,
                "icon": c.icon,
            }
            for c in cats
        ],
    }


@router.get("/locations")
def get_locations(db: Session = Depends(get_db)):
    locations = db.query(Location).filter(Location.is_active == True).all()
    return {
        "status": "success",
        "locations": [
            {
                "id": loc.id,
                "building_name": loc.building_name,
                "block_code": loc.block_code,
                "floor": loc.floor,
                "room_number": loc.room_number,
                "landmark": loc.landmark,
            }
            for loc in locations
        ],
    }


@router.get("/inventory")
def get_inventory(db: Session = Depends(get_db)):
    items = db.query(InventoryItem).all()
    return {
        "status": "success",
        "inventory": [
            {
                "id": item.id,
                "item_name": item.item_name,
                "item_code": item.item_code,
                "category_id": item.category_id,
                "quantity": item.quantity,
                "unit": item.unit,
                "min_threshold": item.min_threshold,
                "unit_cost": float(item.unit_cost) if item.unit_cost else 0.0,
            }
            for item in items
        ],
    }
