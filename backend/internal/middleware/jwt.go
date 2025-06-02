package middleware

import (
	"context"
	"net/http"
	"strings"

	"fmt"

	"github.com/go-kratos/kratos/v2/errors"
	"github.com/go-kratos/kratos/v2/middleware"
	"github.com/go-kratos/kratos/v2/transport"
	"github.com/golang-jwt/jwt/v4"
)

var JwtSecret = []byte("aigcjujumiao") // 建议放配置

type CustomClaims struct {
	Email string `json:"email"`
	jwt.StandardClaims
}

// 导出 context key
type CtxKeyEmail struct{}

func JWTAuth() middleware.Middleware {
	// 需要校验的路由集合
	protectedPaths := map[string]struct{}{
		"/api/chat":         {},
		"/api/conversation": {},
		"/api/userInfo":     {},
	}
	return func(handler middleware.Handler) middleware.Handler {
		return func(ctx context.Context, req interface{}) (interface{}, error) {
			// 从 context 取 HTTP 请求
			httpReq, ok := getHTTPRequest(ctx)
			if !ok {
				return nil, errors.Unauthorized("UNAUTHORIZED", "无法获取HTTP请求")
			}

			path := httpReq.URL.Path
			// 判断是否需要校验
			if _, needAuth := protectedPaths[path]; !needAuth {
				// 不需要校验，直接放行
				return handler(ctx, req)
			}

			auth := httpReq.Header.Get("Authorization")
			if auth == "" || !strings.HasPrefix(auth, "Bearer ") {
				return nil, errors.Unauthorized("UNAUTHORIZED", "未登录")
			}
			tokenStr := strings.TrimPrefix(auth, "Bearer ")
			token, err := jwt.ParseWithClaims(tokenStr, &CustomClaims{}, func(token *jwt.Token) (interface{}, error) {
				return JwtSecret, nil
			})
			if err != nil || !token.Valid {
				return nil, errors.Unauthorized("UNAUTHORIZED", "无效token")
			}

			claims, ok := token.Claims.(*CustomClaims)
			if !ok {
				return nil, errors.Unauthorized("BAD_REQUEST", "无法解析声明")
			}

			// 从 claims 中获取账号信息
			email := claims.Email
			fmt.Println(email)
			// 存入 context
			ctx = context.WithValue(ctx, CtxKeyEmail{}, email)

			return handler(ctx, req)
		}
	}
}

// 辅助函数：从 context 获取 *http.Request
func getHTTPRequest(ctx context.Context) (*http.Request, bool) {
	type httpKey struct{}
	val := ctx.Value(httpKey{})
	if req, ok := val.(*http.Request); ok {
		return req, true
	}
	// 兼容 kratos v2.6+，推荐用 transport.FromServerContext
	if tr, ok := transport.FromServerContext(ctx); ok {
		if httpTr, ok := tr.(interface{ Request() *http.Request }); ok {
			return httpTr.Request(), true
		}
	}
	return nil, false
}
