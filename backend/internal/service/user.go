package service

import (
	"context"
	"fmt"
	"math/rand"
	"time"

	pb "backend/api/aigc/v1"

	"backend/internal/biz"
	"backend/internal/conf"
	"backend/internal/data"

	"backend/internal/middleware"

	"github.com/golang-jwt/jwt/v5"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"golang.org/x/crypto/bcrypt"
	"gopkg.in/gomail.v2"
)

var jwtSecret = []byte("aigcjujumiao") // 建议放到配置文件

type UserService struct {
	pb.UnimplementedUserServer
	uc   *biz.UserUsecase
	data *data.Data
	mail *conf.Mail
}

func NewUserService(uc *biz.UserUsecase, data *data.Data, mail *conf.Mail) *UserService {
	return &UserService{uc: uc, data: data, mail: mail}
}

func (s *UserService) SendCode(ctx context.Context, req *pb.SendCodeRequest) (*pb.SendCodeReply, error) {
	email := req.Email
	if email == "" {
		return &pb.SendCodeReply{Code: 400, Message: "邮箱不能为空"}, nil
	}

	code := fmt.Sprintf("%06d", rand.Intn(1000000))
	subject := "【AIGC系统】验证码"
	body := fmt.Sprintf(`
	<html>
	<body>
		<h3>您的验证码是：%s</h3>
		<p>有效期：5分钟</p>
	</body>
	</html>
	`, code)

	// 发送邮件
	m := gomail.NewMessage()
	m.SetHeader("From", s.mail.FromAddress)
	m.SetHeader("To", email)
	m.SetHeader("Subject", subject)
	m.SetBody("text/html", body)

	d := gomail.NewDialer(
		s.mail.SmtpHost,
		int(s.mail.SmtpPort),
		s.mail.SmtpUsername,
		s.mail.SmtpPassword,
	)

	fmt.Println(s.mail.SmtpHost, s.mail.SmtpPort, s.mail.SmtpUsername, s.mail.SmtpPassword)

	if err := d.DialAndSend(m); err != nil {
		return &pb.SendCodeReply{Code: 500, Message: "邮件发送失败"}, nil
	}

	// 存储验证码到 Redis
	err := s.data.Redis.Set(ctx, "s:verification:code:"+email, code, 5*time.Minute).Err()
	if err != nil {
		return &pb.SendCodeReply{Code: 500, Message: "验证码存储失败"}, nil
	}

	return &pb.SendCodeReply{Code: 200, Message: "验证码已发送"}, nil
}

func (s *UserService) Register(ctx context.Context, req *pb.RegisterRequest) (*pb.RegisterReply, error) {
	email := req.Email
	password := req.Password
	code := req.Code

	// 1. 校验参数
	if email == "" || password == "" || code == "" {
		return &pb.RegisterReply{Code: 400, Message: "参数不能为空"}, nil
	}

	// 2. 校验验证码
	redisKey := "s:verification:code:" + email
	realCode, err := s.data.Redis.Get(ctx, redisKey).Result()
	if err != nil || realCode != code {
		return &pb.RegisterReply{Code: 400, Message: "验证码错误或已过期"}, nil
	}

	// 3. 检查邮箱是否已注册
	user, err := s.uc.Repo.FindByEmail(ctx, email)
	if err != nil {
		return &pb.RegisterReply{Code: 500, Message: "数据库错误"}, nil
	}
	if user != nil {
		return &pb.RegisterReply{Code: 400, Message: "邮箱已注册"}, nil
	}

	// 4. 密码加密
	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return &pb.RegisterReply{Code: 500, Message: "密码加密失败"}, nil
	}

	// 5. 写入数据库
	newUser := &biz.User{
		ID:       primitive.NewObjectID(),
		Email:    email,
		Password: string(hash),
	}
	err = s.uc.Repo.Create(ctx, newUser)
	if err != nil {
		return &pb.RegisterReply{Code: 500, Message: "注册失败"}, nil
	}

	// 6. 返回成功
	return &pb.RegisterReply{Code: 200, Message: "注册成功"}, nil
}

func (s *UserService) Login(ctx context.Context, req *pb.LoginRequest) (*pb.LoginReply, error) {
	email := req.Email
	password := req.Password

	// 1. 校验参数
	if email == "" || password == "" {
		return &pb.LoginReply{Code: 400, Message: "参数不能为空"}, nil
	}

	// 2. 查找用户
	user, err := s.uc.Repo.FindByEmail(ctx, email)
	if err != nil {
		return &pb.LoginReply{Code: 500, Message: "数据库错误"}, nil
	}
	if user == nil {
		return &pb.LoginReply{Code: 400, Message: "用户不存在"}, nil
	}

	// 3. 校验密码
	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(password)); err != nil {
		return &pb.LoginReply{Code: 400, Message: "密码错误"}, nil
	}

	// 4. 生成 token
	token, err := GenerateToken(email)
	if err != nil {
		return &pb.LoginReply{Code: 500, Message: "生成token失败"}, nil
	}

	// 5. 返回
	return &pb.LoginReply{Code: 200, Token: token, Message: "登录成功"}, nil
}

func GenerateToken(email string) (string, error) {
	claims := jwt.MapClaims{
		"email": email,
		"exp":   time.Now().Add(24 * time.Hour).Unix(),
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenStr, err := token.SignedString(jwtSecret)
	if err != nil {
		return "", err
	}

	return tokenStr, nil
}

func (s *UserService) GetUserInfo(ctx context.Context, req *pb.GetUserInfoRequest) (*pb.GetUserInfoReply, error) {
	email, _ := ctx.Value(middleware.CtxKeyEmail{}).(string)
	return &pb.GetUserInfoReply{Code: 200, Email: email, Message: "获取成功"}, nil
}
