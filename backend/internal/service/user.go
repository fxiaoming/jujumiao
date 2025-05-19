package service

import (
	"context"
	"errors"
	// "fmt"
	// "math/rand"
	"time"

	pb "backend/api/aigc/v1"

	"github.com/golang-jwt/jwt/v5"
	// "gopkg.in/gomail.v2"
	"backend/internal/biz"
)

var jwtSecret = []byte("aigcjujumiao") // 建议放到配置文件

type UserService struct {
	pb.UnimplementedUserServer
	uc *biz.UserUsecase
}

func NewUserService(uc *biz.UserUsecase) *UserService {
	return &UserService{uc: uc}
}

func (s *UserService) SendCode(ctx context.Context, req *pb.SendCodeRequest) (*pb.SendCodeReply, error) {
	// email := req.Email

	// code := fmt.Sprintf("%06d", rand.Intn(1000000))

	// subject := "【AIGC系统】验证码"
	// body := fmt.Sprintf(`
	// <html>
	// <body>
	// 	<h3>您的验证码是：%s</h3>
	// 	<p>有效期：5分钟</p>
	// </body>
	// </html>
	// `, code)

	// // 异步发送邮件
	// go func() {
	// 	m := gomail.NewMessage()
	// 	m.SetHeader("From", conf.FromAddress)
	// 	m.SetHeader("To", email)
	// 	m.SetHeader("Subject", subject)
	// 	m.SetBody("text/html", body)

	// 	d := gomail.NewDialer(
	// 		s.config.SmtpHost,
	// 		int(s.config.SmtpPort),
	// 		s.config.SmtpUsername,
	// 		s.config.SmtpPassword,
	// 	)

	// 	if err := d.DialAndSend(m); err != nil {
	// 		fmt.Println("邮件发送失败:", err)
	// 	}
	// }()

	// // 存储验证码到数据库
	// redisClient.Set(ctx, `s:verification:code:`+email, code, time.Minute*5)
	return &pb.SendCodeReply{}, nil
}
func (s *UserService) Register(ctx context.Context, req *pb.RegisterRequest) (*pb.RegisterReply, error) {
	return &pb.RegisterReply{}, nil
}
func (s *UserService) Login(ctx context.Context, req *pb.LoginRequest) (*pb.LoginReply, error) {
	return &pb.LoginReply{}, nil
}

func GenerateToken(email string) (string, error) {
	claims := jwt.MapClaims{
		"email": email,
		"exp":   time.Now().Add(24 * time.Hour).Unix(),
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(jwtSecret)
}

func CheckToken(tokenStr string) (string, error) {
	token, err := jwt.Parse(tokenStr, func(token *jwt.Token) (interface{}, error) {
		return jwtSecret, nil
	})
	if err != nil || !token.Valid {
		return "", errors.New("无效token")
	}
	return token.Claims.(jwt.MapClaims)["email"].(string), nil
}
