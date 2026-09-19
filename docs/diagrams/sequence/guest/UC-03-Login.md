# UC-03: Đăng nhập (Login) - Sequence Diagram

```plantuml
@startuml
skinparam style strictuml
actor "Guest / User" as user
participant "Frontend (Next.js)" as ui
participant "API Gateway (Express)" as gateway
participant "Auth Controller" as ctrl
participant "Auth Service" as svc
database "Database (Prisma)" as db

user -> ui: Nhập email và mật khẩu\nNhấn "Đăng nhập"
activate ui

ui -> gateway: POST /api/auth/login\n{ email, password }
activate gateway

gateway -> gateway: Joi validate request body
alt Validation failed
    gateway --> ui: 400 Bad Request\n{ message: "..." }
    ui --> user: Hiển thị lỗi validation
else Validation passed

gateway -> ctrl: login(email, password)
activate ctrl

ctrl -> svc: login(email, passwordPlain)
activate svc

svc -> db: findUnique({ where: { email }, include: { roles } })
activate db
db --> svc: User record kèm roles
deactivate db

alt User không tồn tại
    svc --> ctrl: throw Error("Email hoặc mật khẩu không đúng")
    ctrl --> gateway: 401 Unauthorized
    gateway --> ui: Lỗi xác thực
    ui --> user: Hiển thị "Email hoặc mật khẩu không đúng"
else User bị vô hiệu hóa (is_active = false)
    svc --> ctrl: throw Error("Tài khoản đã bị vô hiệu hóa")
    ctrl --> gateway: 401 Unauthorized
    gateway --> ui: Lỗi tài khoản
    ui --> user: Hiển thị "Tài khoản đã bị vô hiệu hóa"
else User tồn tại và active
    svc -> svc: bcrypt.compare(password, user.password_hash)
    alt Mật khẩu sai
        svc --> ctrl: throw Error("Email hoặc mật khẩu không đúng")
        ctrl --> gateway: 401 Unauthorized
        gateway --> ui: Lỗi xác thực
        ui --> user: Hiển thị "Email hoặc mật khẩu không đúng"
    else Mật khẩu đúng
        svc -> svc: generateToken(payload) → JWT (7 ngày)
        svc --> ctrl: { token, user: { id, email, fullName, roles } }
        deactivate svc

        ctrl -> ctrl: res.cookie("jwt", token, { httpOnly, secure, sameSite })
        ctrl --> gateway: 200 OK\n{ status: "success", data: { token, user } }
        deactivate ctrl
        gateway --> ui: 200 OK + Set-Cookie: jwt=<token>
        deactivate gateway

        ui -> ui: dispatch(setCredentials({ user }))
        ui -> ui: getDashboardPathByRole(user.roles)
        ui --> user: Chuyển hướng đến Dashboard\n(Customer / Advisor / Manager / Admin)
    end
end
end

deactivate ui

@enduml
```
