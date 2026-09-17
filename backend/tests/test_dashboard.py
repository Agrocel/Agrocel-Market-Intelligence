import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.database import Base
from app.models import Product,Geography,MarketPrice
from app.services import overview
from datetime import date
def test_overview_price_calculation():
 engine=create_engine('sqlite:///:memory:'); Base.metadata.create_all(engine); db=sessionmaker(bind=engine)(); p=Product(name='Bromine',chemical_name='Bromine',product_code='BR2');g=Geography(country='China',region='Asia',iso_code='CHN');db.add_all([p,g]);db.commit();db.add_all([MarketPrice(product_id=p.id,geography_id=g.id,price_date=date(2026,1,1),price_value=100,currency='USD',unit='MT',source_name='test'),MarketPrice(product_id=p.id,geography_id=g.id,price_date=date(2026,2,1),price_value=110,currency='USD',unit='MT',source_name='test')]);db.commit(); assert overview(db)['latest_price']['change_percent']==10;db.close()
