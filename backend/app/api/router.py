from fastapi import APIRouter
from app.api.endpoints import scan, community, training_program, auth, payment

api_router = APIRouter()
api_router.include_router(scan.router, prefix="/scan", tags=["Scanner"])
api_router.include_router(community.router, prefix="/community", tags=["Community"])
api_router.include_router(training_program.router, prefix="/scan/training-program", tags=["Placement Program Scanner"])
api_router.include_router(auth.router, prefix="/auth", tags=["Auth"])
api_router.include_router(payment.router, prefix="/payment", tags=["Payment"])
