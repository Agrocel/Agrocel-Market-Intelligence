"""Seed a safe, non-confidential dashboard dataset; source filenames point to the provided raw data."""
from datetime import date
from pathlib import Path
from app.database import Base, engine, SessionLocal
from app.models import *

Base.metadata.create_all(engine); db=SessionLocal()
if not db.query(Product).filter_by(product_code='BR2').first():
 db.add(Product(name='Bromine',chemical_name='Bromine',product_code='BR2'))
 db.add_all([Geography(country='India',region='South Asia',iso_code='IND'),Geography(country='China',region='East Asia',iso_code='CHN')])
 db.add_all([Competitor(name='ICL Group',country='Israel',listed_company=True,stock_ticker='ICL',website='https://www.icl-group.com'),Competitor(name='Gulf Resources',country='China',listed_company=True,stock_ticker='GURE',website='https://www.gulfresourcesinc.com')]);db.commit()
 p=db.query(Product).filter_by(product_code='BR2').one(); india=db.query(Geography).filter_by(iso_code='IND').one(); china=db.query(Geography).filter_by(iso_code='CHN').one(); icl=db.query(Competitor).filter_by(name='ICL Group').one()
 raw='Data/Raw'
 report=SourceDocument(title='Richard Bromine Market Report — June 2026',source_type='RICHARD_REPORT',source_name='Richard Report',file_path=f'{raw}/RICHARD REPORT/Market report-bromine-Jun. 2026.pdf',original_file_name='Market report-bromine-Jun. 2026.pdf',processing_status='INDEX_PENDING')
 news=SourceDocument(title='Competitor capacity and supply update',source_type='NEWS',source_name='Demo market intelligence',source_url='https://www.icl-group.com',processing_status='READY')
 db.add_all([report,news]);db.flush()
 prices=[(1,2860),(2,2910),(3,2940),(4,2890),(5,2975),(6,3020),(7,3080),(8,3050)]
 for m,v in prices: db.add(MarketPrice(product_id=p.id,geography_id=china.id,price_date=date(2026,m,1),price_value=v,currency='USD',unit='MT',source_name='China Price Data.xlsx',source_url=None,confidence_grade='B'))
 for m in range(1,9):
  db.add(TradeRecord(product_id=p.id,trade_date=date(2026,m,1),trade_direction='EXPORT',reporting_country='India',partner_country='World',quantity_mt=480+18*m,trade_value_usd=(480+18*m)*(2750+22*m),average_price_usd_per_mt=2750+22*m,hs_code='280130',source_name='Br_IMPEX Data 2023-24.xlsx',source_url=None))
  db.add(TradeRecord(product_id=p.id,trade_date=date(2026,m,1),trade_direction='IMPORT',reporting_country='India',partner_country='World',quantity_mt=105+8*m,trade_value_usd=(105+8*m)*(2950+20*m),average_price_usd_per_mt=2950+20*m,hs_code='280130',source_name='bromine import data-202401-202503.xlsx',source_url=None))
  qty=96+4*m; rate=216000+1200*m; db.add(SalesRecord(product_id=p.id,sales_date=date(2026,m,1),geography_id=india.id,customer_name='Aggregated demo customer',customer_segment='Industrial',quantity_mt=qty,revenue_inr=qty*rate,realization_inr_per_mt=rate,source_file='Solaris_Br2 Sale-2024-25.xlsx'))
 db.add_all([
  IntelligenceItem(title='China Bromine price strengthened in July',summary='Loaded China market data shows a month-on-month price increase. Validate the commercial drivers against the Richard report before action.',event_date=date(2026,7,1),product_id=p.id,geography_id=china.id,intelligence_type='PRICE',impact_level='HIGH',reliability_grade='B',source_document_id=report.id,extracted_by='SYSTEM',review_status='APPROVED'),
  IntelligenceItem(title='Competitor supply monitoring update',summary='Competitor market activity warrants management monitoring for supply and downstream demand signals.',event_date=date(2026,8,1),product_id=p.id,competitor_id=icl.id,intelligence_type='COMPETITOR_MOVE',impact_level='HIGH',reliability_grade='B',source_document_id=news.id,source_url='https://www.icl-group.com',extracted_by='SYSTEM',review_status='APPROVED')])
 db.commit(); print('Seeded Bromine demo data')
else: print('Database already seeded')
