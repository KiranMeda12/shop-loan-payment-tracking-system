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
    if req.shop_name is not None:
        current_user.shop_name = req.shop_name.strip()
    if req.shop_phone is not None:
        current_user.shop_phone = req.shop_phone.strip()
    if req.shop_address is not None:
        current_user.shop_address = req.shop_address.strip()

    if req.username is not None and req.username.strip():
        new_username = req.username.strip()
        if new_username != current_user.username:
            existing = db.query(AdminUser).filter(AdminUser.username == new_username, AdminUser.id != current_user.id).first()
            if existing:
                raise HTTPException(status_code=400, detail="This username is already taken.")
            current_user.username = new_username

    if req.new_password and req.new_password.strip():
        if not req.current_password:
            raise HTTPException(
                status_code=400,
                detail="Please enter your previous password to verify your identity."
            )
        if not verify_password(req.current_password, current_user.password_hash):
            raise HTTPException(
                status_code=400,
                detail="Previous password is incorrect. Please enter your correct current password."
            )
        if len(req.new_password.strip()) < 6:
            raise HTTPException(
                status_code=400,
                detail="New password must be at least 6 characters long."
            )
        current_user.password_hash = hash_password(req.new_password.strip())

    db.commit()
    db.refresh(current_user)
    return UserInfoResponse(
        id=current_user.id,
        username=current_user.username,
        shop_name=current_user.shop_name,
        shop_phone=current_user.shop_phone,
        shop_address=current_user.shop_address
    )
