from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models import AdminUser
from backend.schemas import LoginRequest, TokenResponse, UserInfoResponse, ShopProfileUpdate
from backend.auth import verify_password, hash_password, create_access_token, get_current_admin

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

@router.post("/login", response_model=TokenResponse)
def login(req: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(AdminUser).filter(AdminUser.username == req.username).first()
    if not user or not verify_password(req.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password"
        )

    access_token = create_access_token(data={"sub": user.username})
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserInfoResponse(
            id=user.id,
            username=user.username,
            shop_name=user.shop_name,
            shop_phone=user.shop_phone,
            shop_address=user.shop_address
        )
    )

@router.get("/me", response_model=UserInfoResponse)
def get_me(current_user: AdminUser = Depends(get_current_admin)):
    return UserInfoResponse(
        id=current_user.id,
        username=current_user.username,
        shop_name=current_user.shop_name,
        shop_phone=current_user.shop_phone,
        shop_address=current_user.shop_address
    )

@router.put("/profile", response_model=UserInfoResponse)
def update_profile(
    req: ShopProfileUpdate,
    db: Session = Depends(get_db),
    current_user: AdminUser = Depends(get_current_admin)
):
    if req.shop_name:
        current_user.shop_name = req.shop_name
    if req.shop_phone:
        current_user.shop_phone = req.shop_phone
    if req.shop_address:
        current_user.shop_address = req.shop_address
    if req.new_password and len(req.new_password) >= 6:
        current_user.password_hash = hash_password(req.new_password)

    db.commit()
    db.refresh(current_user)
    return UserInfoResponse(
        id=current_user.id,
        username=current_user.username,
        shop_name=current_user.shop_name,
        shop_phone=current_user.shop_phone,
        shop_address=current_user.shop_address
    )
