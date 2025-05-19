package middleware

import (
	"context"
	"errors"

	"net/http"
	"strings"

	"github.com/go-kratos/kratos/v2/middleware"
	"github.com/go-kratos/kratos/v2/transport"
	"github.com/golang-jwt/jwt/v4"
)

var JwtSecret = []byte("your_secret_key") // 建议放配置

func JWTAuth() middleware.Middleware {
	// 需要校验的路由集合
	protectedPaths := map[string]struct{}{
		"/api/chat":         {},
		"/api/conversation": {},
	}
	return func(handler middleware.Handler) middleware.Handler {
		return func(ctx context.Context, req interface{}) (interface{}, error) {
			// 从 context 取 HTTP 请求
			httpReq, ok := getHTTPRequest(ctx)
			if !ok {
				return nil, errors.New("无法获取HTTP请求")
			}

			path := httpReq.URL.Path
			// 判断是否需要校验
			if _, needAuth := protectedPaths[path]; !needAuth {
					// 不需要校验，直接放行
					return handler(ctx, req)
			}

			auth := httpReq.Header.Get("Authorization")
			if auth == "" || !strings.HasPrefix(auth, "Bearer ") {
				return nil, errors.New("未登录")
			}
			tokenStr := strings.TrimPrefix(auth, "Bearer ")
			token, err := jwt.Parse(tokenStr, func(token *jwt.Token) (interface{}, error) {
				return JwtSecret, nil
			})
			if err != nil || !token.Valid {
				return nil, errors.New("无效token")
			}
			// 校验通过，继续
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
